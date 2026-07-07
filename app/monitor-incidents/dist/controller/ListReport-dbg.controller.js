sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("monitorincidents.controller.ListReport", {

        onOpenCreateItemDialog() {
            this.byId("createItemDialog").open();
        },

        onCloseCreateItemDialog() {
            this.byId("createItemDialog").close();
        },

        onCreateItem() {
            const title = this.byId("inputTitle").getValue();
            const descr = this.byId("inputDescr").getValue();
            const quantity = parseInt(this.byId("inputQuantity").getValue());

            const model = this.getOwnerComponent().getModel();
            const action = model.bindContext("/createItem(...)");
            action.setParameter("title", title);
            action.setParameter("descr", descr);
            action.setParameter("quantity", quantity);

            action.execute().then(() => {
                MessageToast.show("Item created!");
                this.onCloseCreateItemDialog();
                this.byId("itemsTable").getBinding("items").refresh();
            }).catch((error) => {
                MessageBox.error(error.message);
            });
        },

        onOpenSearchByQuantityDialog() {
            this.byId("searchByQuantityDialog").open();
        },

        onCloseSearchByQuantityDialog() {
            this.byId("searchByQuantityDialog").close();
        },

        onSearchByQuantity() {
            const quantity = parseInt(this.byId("inputSearchQuantity").getValue());
            this.rebindItemsTable(`/getItemsByQuantity(quantity=${quantity})`);
            this.onCloseSearchByQuantityDialog();
        },

        onResetItems() {
            this.rebindItemsTable("/Items");
        },

        rebindItemsTable(path) {
            const table = this.byId("itemsTable");
            table.bindItems({
                path: path,
                template: table.getBindingInfo("items").template,
                templateShareable: true
            });
        }

    });
});
