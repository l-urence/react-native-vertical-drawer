'use strict';

var React = require('react-native');
var { StyleSheet, View } = React;

var DefaultHandle = React.createClass({
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.bar} />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(200, 200, 200, .8)',
    borderRadius: 5,
    height: 8,
    width: 40
  }
});

module.exports = DefaultHandle;
