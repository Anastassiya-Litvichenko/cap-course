const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  async init() {
    this.before("UPDATE", "Incidents", (req) => this.onUpdate(req));
    this.before("CREATE", "Incidents", (req) => this.changeUrgencyDueToSubject(req.data));
    this.on('READ', 'Customers', (req) => this.onCustomerRead(req));
    this.on(['CREATE','UPDATE'], 'Incidents', (req, next) => this.onCustomerCache(req, next));
    this.S4bupa = await cds.connect.to('API_BUSINESS_PARTNER');
    this.remoteService = await cds.connect.to('RemoteService');
    console.log('>>> connecting to Northwind...');
    this.northwindLocal = await cds.connect.to('Northwind');
    console.log('>>> Northwind connected:', this.northwindLocal.options);

    this.after('READ', 'Incidents', async (incidents, req) => {
      const { Customers } = this.entities;
      const customers = await SELECT.from(Customers);
      console.log('Customers:', customers);
  });

  this.on('getOrders', async () => {
      const { Orders } = this.northwindLocal.entities;
      return this.northwindLocal.run(
        SELECT.from(Orders)
          .columns('OrderID', 'CustomerID', 'OrderDate', 'ShipCountry')
          .limit(10)
        );
    });

  this.on('getOrders2', async () => {
      const northwindHybrid = await cds.connect.to('Northwind2');
      const { Orders } = northwindHybrid.entities;
      return northwindHybrid.run(
        SELECT.from(Orders)
          .columns('OrderID', 'CustomerID', 'OrderDate', 'ShipCountry')
          .limit(10)
        );
    });

    this.on('getItemsByQuantity', async (req) => {
      const { quantity } = req.data;
      const { Items } = this.entities;
      return SELECT.from(Items).where({ quantity });
    });

    this.on('createItem', async (req) => {
      const { title, descr, quantity } = req.data;
      const { Items } = this.entities;
      if (quantity > 100) return req.reject(400, 'Quantity must not exceed 100');
      const ID = cds.utils.uuid();
      await INSERT.into(Items).entries({ ID, title, descr, quantity });
      return SELECT.one.from(Items).where({ ID });
    });

    this.before('CREATE', 'Items', (req) => {
      if (req.data.quantity > 100) {
        req.reject(400, 'Quantity must not exceed 100');
      }
    });

    return super.init();
  }

  async onCustomerCache(req, next) {
  const { Customers } = this.entities;
  const newCustomerId = req.data.customer_ID;
  const result = await next();
  const { BusinessPartner } = this.remoteService.entities;
  if (newCustomerId && newCustomerId !== "") {
    console.log('>> CREATE or UPDATE customer!');

    const customer = await this.S4bupa.run(SELECT.one(BusinessPartner, bp => {
      bp('*');
        bp.addresses(address => {
          address('email', 'phoneNumber');
            address.email(emails => {
              emails('email')
            });
            address.phoneNumber(phoneNumber => {
              phoneNumber('phone')
            })
        })
    }).where({ ID: newCustomerId }));

    if(customer) {
      customer.email = customer.addresses[0]?.email[0]?.email;
      customer.phone = customer.addresses[0]?.phoneNumber[0]?.phone;
      delete customer.addresses;
      delete customer.name;
      await UPSERT.into(Customers).entries(customer);
    }
  }
  return result;
}

 async onCustomerRead(req) {
    console.log('>> delegating to S4 service...', req.query);
    const top = parseInt(req._queryOptions?.$top) || 100;
    const skip = parseInt(req._queryOptions?.$skip) || 0;

    const { BusinessPartner } = this.remoteService.entities;

    let result = await this.S4bupa.run(SELECT.from(BusinessPartner, bp => {
      bp('*'),
        bp.addresses(address => {
            address.email(emails => {
              emails('email');
            });
        })
    }).limit(top, skip));

    result = result.map((bp) => ({
      ID: bp.ID,
      name: bp.name,
      email: bp.addresses[0]?.email[0]?.email
    }));

    // Explicitly set $count so the values show up in the value help in the UI
    result.$count = 1000;
    console.log("after result", result);
    return result;
  }

  changeUrgencyDueToSubject(data) {
    let urgent = data.title?.match(/urgent/i)
    if (urgent) data.urgency_code = 'H'
  }

  /** Custom Validation */
  async onUpdate (req) {
    let closed = await SELECT.one(1) .from (req.subject) .where `status.code = 'C'`
    if (closed) req.reject `Can't modify a closed incident!`
  }
}
module.exports = { ProcessorService }
