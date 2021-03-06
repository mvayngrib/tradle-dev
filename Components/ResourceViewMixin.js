'use strict';
 
var utils = require('../utils/utils');
var ResourceView = require('./ResourceView');
var ResourceList = require('./ResourceList');
var constants = require('tradle-constants');


var ResourceViewMixin = {
  showRefResource(resource, prop) {
    if (resource[constants.TYPE] + '_' + resource[constants.ROOT_HASH] !== this.state.propValue)
      return;
    var model = utils.getModel(resource[constants.TYPE]).value;
    var title = utils.getDisplayName(resource, model.properties);
    this.props.navigator.push({
      title: title,
      id: 3,
      component: ResourceView,
      titleTextColor: '#7AAAC3',
      // rightButtonTitle: 'Edit',
      backButtonTitle: 'Back',
      passProps: {resource: resource, prop: prop}
    });    
  },
  showResources(resource, prop) {
    this.props.navigator.push({
      id: 10,
      title: utils.makeLabel(prop.title),
      titleTextColor: '#7AAAC3',
      backButtonTitle: 'Back',
      component: ResourceList,
      passProps: {
        modelName: prop.items.ref,
        filter: '',
        resource: resource,
        prop: prop
      }
    });
  }
}
module.exports = ResourceViewMixin;