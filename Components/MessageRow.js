'use strict';

var React = require('react-native');
var utils = require('../utils/utils');
var ArticleView = require('./ArticleView');
var MessageView = require('./MessageView');
var NewResource = require('./NewResource');
var moment = require('moment');
var extend = require('extend');
var groupByEveryN = require('groupByEveryN');

var {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  ListView,
  // LayoutAnimation,
  Component,
  View
} = React;

class MessageRow extends Component {
  constructor(props) {
    super(props);
    var dataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    });

    this.state = {
      resource: this.props.resource,
      dataSource: dataSource
      // viewStyle: {
      //   margin: 1,
      // },
      // cnt: 0
    }
  }
  render() {
    var resource = this.props.resource;
    var isModel = !resource['_type'];
    if (isModel  &&  resource.autoCreate)
      return <View style={{height: 0}} />;
    var model = utils.getModel(resource['_type'] || resource.id).value;
    var me = utils.getMe();
    var isMyMessage;
    if (!isModel  &&  !this.props.isAggregation) {
      var fromHash = resource[utils.getCloneOf('tradle.Message.from', model.properties)].id;
      if (fromHash == me['_type'] + '_' + me.rootHash) 
        isMyMessage = true;      
    }
    var to = this.props.to;
    var ownerPhoto, hasOwnerPhoto;
    if (isMyMessage  || !to  ||  !to.photos || isModel)
      ownerPhoto = <View style={styles.cell}></View>
    else {
      var uri = utils.getImageUri(to.photos[0].url);
      ownerPhoto = <Image source={{uri: uri}} style={styles.msgImage} /> 
      hasOwnerPhoto = true;
    }
    var renderedRow = [];
    var onPressCall;
    if (isModel) 
      onPressCall = this.props.onSelect;
    else
      onPressCall = this.formatRow(isMyMessage, model, resource, renderedRow);
    
    var addStyle;
    var noMessage = !resource.message  ||  !resource.message.length;
    if (!renderedRow.length) {
      var vCols = isModel 
                ? utils.getDisplayName(resource) 
                : noMessage ? null : utils.getDisplayName(resource, model.properties);
      if (vCols)                
        renderedRow = <Text style={[styles.resourceTitle]} numberOfLines={2}>{vCols}</Text>;
    }
    else if (!isModel) {
      var fromHash = resource[utils.getCloneOf('tradle.Message.from', model.properties)].id;
      if (isMyMessage) { 
        if (!noMessage)
          addStyle = styles.myCell;
      }
      else {
        if (!model.style)
          addStyle = {padding: 5, borderRadius: 10, borderColor: '#cccccc', backgroundColor: '#ffffff'};
        else
          addStyle = {padding: 5, borderRadius: 10};
      }
      if (model.style)
        addStyle = [addStyle, {backgroundColor: '#efffe5'}]; //model.style];
        // viewCols = <View style={styles.myCell}>{viewCols}</View>
    }
    var properties = model.properties;
    var verPhoto, photosList;
    if (!isModel  &&  properties.photos) {
      if (resource.photos) {
        var rem = resource.photos.length % 3;
        var inRow = resource.photos.length === 1 ? 1 : rem ? 2 : 3;
        var style;
        if (inRow === 1)
          style = styles.bigImage;
        else if (inRow === 2)
          style = styles.mediumImage;
        else
          style = styles.image;
        var photos = [];
        for (var p of resource.photos) {
          photos.push(<Image  source={{uri: utils.getImageUri(p.url)}} style={style} />)
        }  
        var photoListStyle = {
          flexDirection: 'row', 
          alignSelf: isMyMessage ? 'flex-end' : 'flex-start', 
          marginLeft: isMyMessage ? 30 : 10,
          marginRight: 5,
          borderRadius: 10 
        }
        photosList = this.renderPhotoList(photos, inRow, photoListStyle);
        // photosList = <View style={photoListStyle}>
        //               {photos}
        //             </View>  

      }
      else
        verPhoto = <View style={{height: 0, width:0}} />
    }
    else if (isModel  &&  this.props.owner  &&  this.props.owner.photos) {
      var ownerImg = this.props.owner.photos[0].url;
      var url = utils.getImageUri(ownerImg);
      verPhoto = <Image source={{uri: ownerImg}} style={styles.ownerImage} />
    }
    var rowStyle = isModel && model.style 
                 ? [styles.row, {backgroundColor: '#efffe5'}] 
                 : noMessage ? {} : styles.row;
    var val;
    var date;
    if (!isModel  &&  resource.time) {
      var previousMessageTime = this.props.previousMessageTime;      
      var showTime = !previousMessageTime;

      if (!showTime)  {
        var prevDate = new Date(previousMessageTime);
        var curDate = new Date(resource.time);
        showTime = resource.time - previousMessageTime > 3600000 ||
                   prevDate.getDate()  !== curDate.getDate()  ||
                   prevDate.getMonth() !== curDate.getMonth() ||
                   prevDate.getYear()  !== curDate.getYear() 
      }

      if (showTime)
        val = utils.getFormattedDate(resource.time);
    }
    
    var date = val 
             ? <Text style={styles.date} numberOfLines={1}>{val}</Text>
             : <View />;
    var messageBody = <View style={addStyle ? [styles.textContainer, addStyle] : styles.textContainer}>
                        <View style={{flex: 1}}>
                          {renderedRow}
                       </View>
                      </View>;

    var showMessageBody;
    if (!isModel  &&  noMessage) {
      if (hasOwnerPhoto) 
        showMessageBody = true;
    }
    else 
      showMessageBody = true;
    if (showMessageBody)
        messageBody = 
          <TouchableHighlight onPress={onPressCall ? onPressCall : () => {}} underlayColor={isMyMessage ? '#D7E6ED' : '#ffffff'}>
            <View style={[rowStyle, {flexDirection: 'row', width: 340, alignSelf: isMyMessage ? 'flex-end' : 'flex-start'}]}>
              {ownerPhoto}
              {messageBody}
            </View>
          </TouchableHighlight>      
    else
      messageBody = <View style={{height: 7}}/>

    return (
      <View style={{margin:1, backgroundColor: '#f7f7f7' }}>
        {date}
        {messageBody}
        <TouchableHighlight onPress={onPressCall ? onPressCall: () => {}} underlayColor={isMyMessage ? '#D7E6ED' : '#ffffff'}>
          <View>
            {photosList}
          </View>
        </TouchableHighlight>
        <View style={isModel ? {backgroundColor: '#cccccc'} : {backgroundColor: '#ffffff'}} />
      </View>
    );
  }
  renderPhotoList(val, inRow, style) {
    var dataSource = this.state.dataSource.cloneWithRows(
      groupByEveryN(val, inRow)
    );
    return (
      <View style={style}>
         <ListView
            renderRow={this.renderRow.bind(this, style)}
            dataSource={dataSource} />
      </View>
    );
  }
  renderRow(style, photos)  {
    var photos = photos.map((photo) => {
      if (photo === null) 
        return null;
      return (
        <View style={this.state.viewStyle}>
          {photo}
        </View>
      );
    });

    return (
      <View style={styles.row}>
        {photos}
      </View>
    );
  }

  onPress(event) {
    this.props.navigator.push({
      component: ArticleView,
      passProps: {url: this.props.resource.message}
    });
  }
  createNewResource(model) {
    this.props.navigator.push({
      id: 4,
      title: model.title,
      component: NewResource,
      titleTextColor: '#7AAAC3',
      passProps:  {
        model: model,
        resource: {
          '_type': model.id, 
          'from': this.props.resource.to,
          'to': this.props.resource.from,
          'message': this.props.resource.message,
        }
      }
    });    
  }

  verify(event) {
    var self = this;
    var resource = self.props.resource;
    var model = utils.getModel(resource['_type']).value;
    this.props.navigator.push({
      id: 5,
      component: MessageView,
      backButtonTitle: 'Back',
      // rightButtonTitle: 'Edit',
      // onRightButtonPress: {
      //     title: 'Edit',
      //     component: NewResource,
      //     titleTextColor: '#7AAAC3',
      //     id: 4,
      //     passProps: {
      //       resource: resource,
      //       metadata: model,
      //       callback: this.props.onSelect,
      //       resourceKey: model.id + '_' + resource.rootHash
      //     }
      // }, 

      passProps: {resource: self.props.resource, verify: true},
      title: resource['_type'] == 'tradle.AssetVerification' ? 'Doc verification' : model.title
    });
  }
  formatRow(isMyMessage, model, resource, renderedRow) {
    var viewCols = model.gridCols || model.viewCols;
    if (!viewCols)
      return
    var verPhoto;
    var vCols = [];
    var first = true;
    var self = this;
    var model = utils.getModel(resource['_type'] || resource.id).value;

    var properties = model.properties;
    var noMessage = !resource.message  ||  !resource.message.length;
    var onPressCall;

    var isSimpleMessage = model.id === 'tradle.SimpleMessage';
    
    viewCols.forEach(function(v) {
      var style = styles.resourceTitle; //(first) ? styles.resourceTitle : styles.description;
      if (isMyMessage) {
        style = [style, {justifyContent: 'flex-end', paddingLeft: 5}];
        if (isSimpleMessage)
          style.push({color: '#ffffff'});
      }

      if (properties[v].ref) {
        if (resource[v]) 
          vCols.push(<Text style={style} numberOfLines={first ? 2 : 1}>{resource[v].title}</Text>);
      }
      else if (properties[v].type === 'array') 
        return;
      else if (properties[v].type === 'date') {
        return;
        // style = styles.description
        // if (isMyMessage  &&  isSimpleMessage) {
        //   var dateStyle = noMessage ? {alignSelf: 'flex-end', color: '#999999'} : {color: '#eeeeee'};
        //   style = [style, dateStyle];
        // }
        // var val = utils.getFormattedDate(new Date(resource[v]));
        // vCols.push(<Text style={style} numberOfLines={first ? 2 : 1}>{val}</Text>)
      }
      else  {
        if (resource[v]  &&  (resource[v].indexOf('http://') == 0  ||  resource[v].indexOf('https://') == 0)) {
          onPressCall = self.onPress.bind(self);
          vCols.push(<Text style={style} numberOfLines={first ? 2 : 1}>{resource[v]}</Text>);
        }
        else if (!model.autoCreate) {
          var val = (properties[v].displayAs) 
                  ? utils.templateIt(properties[v], resource)
                  : resource[v];
          if (model.properties.verifiedBy  &&  !isMyMessage)                  
            onPressCall = self.verify.bind(self);
          vCols.push(<Text style={style} numberOfLines={first ? 2 : 1}>{val}</Text>)
        }
        else {
          if (!resource[v].length)
            return;
          var msgParts = utils.splitMessage(resource[v]);
          // Case when the needed form was sent along with the message
          if (msgParts.length === 2) {
            var msgModel = utils.getModel(msgParts[1]);
            if (msgModel) {
              if (!isMyMessage)
                onPressCall = self.createNewResource.bind(self, msgModel.value);
              vCols.push(<View>
                           <Text style={style}>{msgParts[0]}</Text>
                           <Text style={[style, {color: isMyMessage ? '#efffe5' : '#7AAAC3'}]}>{msgModel.value.title}</Text>
                         </View>);                  
              return;
            }
          }
          vCols.push(<Text style={style}>{resource[v]}</Text>);
        }
      }
      first = false;
    }); 
    if (model.style) 
      vCols.push(<Text style={styles.verySmallLetters}>{model.title}</Text>);
    
    if (vCols  &&  vCols.length)
      extend(renderedRow, vCols);
    var photosProp = utils.getCloneOf('tradle.Message.photos', properties);
    return onPressCall ? onPressCall : (isSimpleMessage  &&  !resource[photosProp]) ? null : this.props.onSelect;
  }
  // animateViewLayout() {
  //   var resource = this.props.resource;
  //   if (resource['_type'])
  //     return;

  //   LayoutAnimation.configureNext(
  //     LayoutAnimation.Presets.easeInEaseOut,
  //     () => {
  //       console.log('layout animation done.');
  //       // this.addWrapText();
  //     },
  //     (error) => { throw new Error(JSON.stringify(error)); }
  //   );

  //   this.setState({
  //     viewStyle: {
  //       margin: this.state.cnt > 0 ? 0 : (this.state.viewStyle.margin > 1 ? 1 : 2),
  //       cnt: this.state.cnt++
  //     }
  //   });
  // }
}

var styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  resourceTitle: {
    flex: 1,
    flexWrap: 'wrap',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 2,
  },
  date: {
    flex: 1,
    color: '#999999',
    fontSize: 12,
    alignSelf: 'center',
    marginTop: 10
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    // padding: 5,
  },
  cell: {
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
    fontSize: 18
  },
  myCell: { 
    padding: 5, 
    marginRight: 5,
    marginLeft: 30,    
    justifyContent: 'flex-end', 
    borderRadius: 10, 
    backgroundColor: '#569bff',
    color: '#ffffff'
  },
  msgImage: {
    backgroundColor: '#dddddd',
    height: 50,
    marginRight: 10,
    width: 50,
    borderRadius: 25,
    borderColor: '#cccccc',
    borderWidth: 1
  },
  bigImage: {
    width: 180,
    height: 220,
    margin: 1,
    borderRadius: 10
  },
  mediumImage: {
    width: 120,
    height: 120,
    margin: 1,
    borderRadius: 10
  },
  image: {
    width: 80,
    height: 80,
    margin: 1,
    borderRadius: 10
  },
  ownerImage: {
    backgroundColor: '#dddddd',
    height: 30,
    width: 30,
    marginTop: -5,
    position: 'absolute',
    right: 10,
    borderRadius: 15,
    borderColor: '#cccccc',
    borderWidth: 1
  },
  verySmallLetters: {
    fontSize: 12,
    alignSelf: 'flex-end',
    color: '#b4c3cb'
  }
});

module.exports = MessageRow;
