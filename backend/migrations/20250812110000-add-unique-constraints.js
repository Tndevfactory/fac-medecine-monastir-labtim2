"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Publication: unique DOI
    await queryInterface.addConstraint("publications", {
      fields: ["doi"],
      type: "unique",
      name: "unique_publication_doi"
    });
    // CarouselItem: unique order
    await queryInterface.addConstraint("carousel_items", {
      fields: ["order"],
      type: "unique",
      name: "unique_carouselitem_order"
    });
    // PresentationContent: unique sectionName
    await queryInterface.addConstraint("presentation_content", {
      fields: ["sectionName"],
      type: "unique",
      name: "unique_presentationcontent_sectionname"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint("publications", "unique_publication_doi");
    await queryInterface.removeConstraint("carousel_items", "unique_carouselitem_order");
    await queryInterface.removeConstraint("presentation_content", "unique_presentationcontent_sectionname");
  }
};
