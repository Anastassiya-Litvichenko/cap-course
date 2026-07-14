using {sap.capire.incidents as my} from '../db/schema';

/**
 * Service used by support personell, i.e. the incidents' 'processors'.
 */
service ProcessorService {
    @cds.redirection.target
    entity Incidents as projection on my.Incidents;

    @readonly
    entity Customers as projection on my.Customers;

    @readonly
    entity ListOfIncidents as projection on my.ListOfIncidents;

    entity Items as projection on my.Items;

    function getItemsByQuantity(quantity: Integer) returns many Items;
    action   createItem(title: String, descr: String, quantity: Integer) returns Items;
    function getOrders() returns array of {
        OrderID: Integer;
        CustomerID: String;
        OrderDate: DateTime;
        ShipCountry: String;
    };
    function getOrders2() returns array of {
    OrderID: Integer;
    CustomerID: String;
    OrderDate: DateTime;
    ShipCountry: String;
    };
    function getOnPremiseString() returns String;
}

annotate ProcessorService.Incidents with @odata.draft.enabled; 
annotate ProcessorService with @(requires: 'support');


/**
 * Service used by administrators to manage customers and incidents.
 */
service AdminService {
    entity Customers as projection on my.Customers;
    entity Incidents as projection on my.Incidents;
}
annotate AdminService with @(requires: 'admin');
