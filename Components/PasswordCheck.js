var React = require('react-native')
var { View, Image, PropTypes } = React
var PasswordGesture = require('react-native-gesture-password')

var MIN_LENGTH = 5
var Password1 = ''
var BG_IMAGE = require('../img/bg.png')
var Device = require('react-native-device')
var MODES = {
  check: 'check',
  set: 'set'
}

module.exports = React.createClass({
  propTypes: {
    isCorrect: PropTypes.func,
    validate: PropTypes.func,
    onSuccess: PropTypes.func,
    onFail: PropTypes.func,
    maxAttempts: PropTypes.number,
    promptSet: PropTypes.string,
    promptCheck: PropTypes.string,
    promptReenter: PropTypes.string,
    promptRetrySet: PropTypes.string,
    promptRetryCheck: PropTypes.string,
    promptInvalidSet: PropTypes.string,
    successMsg: PropTypes.string,
    failMsg: PropTypes.string,
    mode: function (props, propName) {
      return props[propName] in MODES ? null : new Error('Invalid mode')
    }
  },

  getDefaultProps: function () {
    return {
      validate: () => true,
      promptSet: 'Please choose a gesture-based password',
      promptCheck: 'You know what to do',
      promptReenter: 'Please re-enter the gesture',
      promptInvalidSet: 'Invalid gesture password, please try again',
      promptRetrySet: 'Gestures didn\'t match. Please start again',
      promptRetryCheck: 'Please try again',
      successMsg: 'Correct gesture detected',
      failMsg: 'Authentication failed',
      maxAttempts: Infinity
    }
  },

  getInitialState: function() {
    if (this.props.mode === MODES.check) {
      return {
        status: 'normal',
        message: this.props.promptCheck,
        attempts: 0
      }
    } else {
      return {
        status: 'normal',
        message: this.props.promptSet,
        attempts: 0
      }
    }
  },

  _onStart: function () {
    this.setState({ status: 'normal' })
  },

  _onEntered: function (password) {
    switch (this.props.mode) {
      case MODES.check:
        return this._checkPassword(password)
      case MODES.set:
        return this._setPassword(password)
    }
  },

  _setPassword: function (password) {
    if (this.state.attempts === 0) {
      if (!this.props.validate(password)) {
        return this.setState({
          message: this.props.promptInvalidSet,
          status: 'wrong'
        })
      }

      return this.setState({
        message: this.props.promptReenter,
        attempts: 1,
        password: password,
        status: 'normal'
      })
    }

    if (this.state.password === password) {
      this.setState({
        status: 'right',
        message: ''
      })

      return this.props.onSuccess(password)
    }

    return this.setState({
      attempts: 0,
      status: 'wrong',
      message: this.props.promptRetrySet
    })
  },

  _checkPassword: function (password) {
    this.props.isCorrect(password)
      .then((isCorrect) => {
        if (isCorrect) {
          this.setState({
            status: 'right',
            message: this.props.successMsg
          })

          return this.props.onSuccess()
        }

        if (++this.state.attempts >= this.props.maxAttempts) {
          this.setState({
            status: 'wrong',
            attempts: this.state.attempts,
            message: this.props.failMsg
          })

          return this.props.onFail()
        }

        this.setState({
          status: 'wrong',
          attempts: this.state.attempts,
          message: this.props.promptRetryCheck
        })
      })
      .done()
  },

  render: function() {
    return (
      <View>
        <Image source={BG_IMAGE} style={getBackgroundImgStyle()} />
        <PasswordGesture
          ref='pg'
          hollow={false}
          styles={
            {
              frame: { backgroundColor: 'transparent' },
              msgText: { fontSize: 18 }
            }
          }
          baseColor={'#ffffff'}
          rightColor={'#55ff55'}
          wrongColor={'#ff5555'}
          radius={{ inner: 20, outer: 30 }}
          status={this.state.status}
          message={this.state.message}
          msgStyle={{fontSize:30}}
          onStart={() => this._onStart()}
          onEnd={(password) => this._onEntered(password)}
        />
      </View>
    )
  }
})

function getBackgroundImgStyle () {
  return {
    position:'absolute',
    left: 0,
    top: 0,
    width: Device.width,
    height: Device.height
  }
}

module.exports.Modes = MODES