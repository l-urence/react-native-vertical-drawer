'use strict';

var Handle = require('./DefaultHandle');
var React = require('react-native');
var invariant = require('invariant');
var { Animated, Dimensions, Easing, PanResponder, StyleSheet, View } = React;
var { once } = require('./utils');

const WINDOW_HEIGHT = Dimensions.get('window').height;

var updateHeight = once(function(e, style) {
  var { padding, paddingBottom, paddingTop } = StyleSheet.flatten(style);
  var offset = (padding || 0) + (paddingBottom || 0) + (paddingTop || 0);

  // To enable padding[Bottom|Top] in the content container add the
  // padding value to the fixed container height as offset.
  var contentHeight = e.nativeEvent.layout.height + offset;
  this.setState({contentHeight});
});

var VerticalDrawer = React.createClass({
  propTypes: {
    /**
     * These styles will be applied to the drawers content container view
     * which wrapps all of the child views.
     */
    contentContainerStyle: View.propTypes.style,
    /**
     * Provide the content which will be displayed in the drawer.
     */
    drawer: React.PropTypes.node,
    /**
     * Inject a custom drag handle to pull down or close the the drawer.
     * The handle will be displayed as absolute positioned view on top
     * of the content container.
     */
    dragHandle: React.PropTypes.node,
    /**
     * These styles will be applied to the drag area below the
     * drawer view. This will overwrite the default styles.
     */
    dragStyle: View.propTypes.style,
    /**
     * A boolean which indicates if the drawer is open or closed.
     * If this propery changed after the first render it will open
     * or close the drawer with an animation.
     */
    open: React.PropTypes.bool,
    /**
     * These styles will be applied to the drawers container. You
     * musst set the height style to show the drawer.
     */
    style: View.propTypes.style
  },

  getDefaultProps() {
    return { open: true };
  },

  getInitialState() {
    var { open, style } = this.props;
    var { height } = StyleSheet.flatten(style);

    // TODO: Right now the drawer's height needs do be set via style
    // to allow a closed drawer after mount. It would be nice to
    // compute the height.
    invariant(
      height !== undefined,
      "Musst provide drawer's height as style for %s",
      VerticalDrawer.displayName
    );

    return {
      drawerHeight: height,
      open,
      pos: new Animated.Value(open ? 0 : -height)
    };
  },

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => true,

      onPanResponderGrant: () => {
        var { pos } = this.state;
        this.state.pos.setOffset(pos._value);
        this.state.pos.setValue(0);
      },

      onPanResponderMove: Animated.event([null, {dy: this.state.pos}]),
      onPanResponderRelease: (e, gestureState) => {
        var { drawerHeight, open, pos } = this.state;
        pos.flattenOffset();
        pos._value < -drawerHeight / 5 ? this._close() : this._open();
      }
    });
  },

  componentWillReceiveProps(nextProps) {
    var { open } = this.props;
    if (open && !nextProps.open) {
      this._close();
    } else if (!open && nextProps.open) {
      this._open();
    }
  },

  _close() {
    var height = this.state.drawerHeight;
    var config = { easing: Easing.out(Easing.circle), duration: 100 };

    Animated.timing(this.state.pos, {
      toValue: -height, ...config
    }).start(() => this.setState({open: false}));
  },

  _open() {
    var config = { easing: Easing.inOut(Easing.quad), duration: 250 };

    Animated.timing(this.state.pos, {
      toValue: 0, ...config
    }).start(() => this.setState({open: true}));;;
  },

  render() {
    var { contentHeight, drawerHeight, pos: translateY } = this.state;
    var {
      children,
      contentContainerStyle,
      dragStyle,
      drawer,
      style
    } = this.props;

    // Use window height to prevent jitter, if content height
    // has been updated.
    var height = (contentHeight || WINDOW_HEIGHT);
    var contentStyle = [{height}, styles.contentStyle];
    return (
      <Animated.View
        onLayout={(e) => updateHeight.call(this, e, contentContainerStyle)}
        style={[styles.container, {transform: [{translateY}]}]}
      >
        <View style={style}>{drawer}</View>
        <View style={[contentStyle, contentContainerStyle]}>
          {children}
          <View
            style={[styles.drag, dragStyle]}
            {...this._panResponder.panHandlers}
          >
            {this.props.dragHandle || <Handle />}
          </View>
        </View>
      </Animated.View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drag: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 25,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: -5
  },
  contentStyle: {
    paddingTop: 20
  }
});

module.exports = VerticalDrawer;
