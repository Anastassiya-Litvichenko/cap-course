const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  init() {
    this.before("UPDATE", "Incidents", (req) => this.onUpdate(req));
    this.before("CREATE", "Incidents", (req) => this.changeUrgencyDueToSubject(req.data));

    this.after('READ', 'Incidents', async (incidents, req) => {
      const { Customers } = this.entities;
      const customers = await SELECT.from(Customers);
      debugger;
      console.log('Customers:', customers);
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
