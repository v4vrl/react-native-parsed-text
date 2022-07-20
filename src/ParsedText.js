import React from 'react';
import ReactNative from 'react-native';
import PropTypes from 'prop-types';

import TextExtraction from './lib/TextExtraction';

export const PATTERNS = {
  url: /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*[-a-zA-Z0-9@:%_\+~#?&\/=])*/i,
  phone: /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,7}/,
  email: /\S+@\S+\.\S+/,
  // boldText: /\*(.*?)\*/,
  // italicText: /\_(.*?)\_/,
};

const defaultParseShape = PropTypes.shape({
  ...ReactNative.Text.propTypes,
  type: PropTypes.oneOf(Object.keys(PATTERNS)).isRequired,
});

const customParseShape = PropTypes.shape({
  ...ReactNative.Text.propTypes,
  pattern: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(RegExp)]).isRequired,
});

class ParsedText extends React.Component {

  static displayName = 'ParsedText';

  static propTypes = {
    ...ReactNative.Text.propTypes,
    parse: PropTypes.arrayOf(
      PropTypes.oneOfType([defaultParseShape, customParseShape]),
    ),
    childrenProps: PropTypes.shape(ReactNative.Text.propTypes),
  };

  static defaultProps = {
    parse: null,
    childrenProps: {},
  };

  setNativeProps(nativeProps) {
    this._root.setNativeProps(nativeProps);
  }

  getPatterns() {
    return this.props.parse.map((option) => {
      const {type, ...patternOption} = option;
      if (type) {
        if (!PATTERNS[type]) {
          throw new Error(`${option.type} is not a supported type`);
        }
        patternOption.pattern = PATTERNS[type];
      }

      return patternOption;
    });
  }

  getExtracton(text) {
      const isAlreadyBold = text[0] === '*';
      const isAlreadyItalic = text[0] === '_';
      const isAlreadyST = text[0] === '~';
      if (isAlreadyBold || isAlreadyItalic || isAlreadyST) {
        text = text.substring(1, text.length - 1);
      }
      const textExtraction = new TextExtraction(text, this.getPatterns());
      return textExtraction.parse().map((props, index) => {
          const isItalic = props.children[0] === '_';
          const isBold = props.children[0] === '_';
          const isST = props.children[0] === '~';
          if(props.children.indexOf("*") === 0 && (props.children.indexOf("_") !== -1 || props.children.indexOf("~") !== -1)) {
              return this.getExtracton(props.children);
          }
          if(props.children.indexOf("_") === 0 && (props.children.indexOf("*") !== -1 || props.children.indexOf("~") !== -1)) {
              return this.getExtracton(props.children);
          }
          if(props.children.indexOf("~") === 0 && (props.children.indexOf("*") !== -1 || props.children.indexOf("_") !== -1)) {
              return this.getExtracton(props.children);
          }
          props.children = props.children.split("*").join("").split("_").join("").split("~").join("");
          return (
              <ReactNative.Text
                  key={`parsedText-${index}`}
                  {...this.props.childrenProps}
                  {...props}
                  style={{
                    fontWeight: (isBold || isAlreadyBold) ? 'bold' : 'normal',
                    fontStyle: (isItalic || isAlreadyItalic)  ? 'italic' : 'normal',
                    textDecorationLine : (isAlreadyST || isST) ? 'line-through' : 'none',
                    textDecorationStyle: (isAlreadyST || isST) ? 'solid' : '',
                  }}
              />
          );
      });
  }

  getParsedText() {
    if (!this.props.parse)                       { return this.props.children; }
    if (typeof this.props.children !== 'string') { return this.props.children; }

    const textExtraction = new TextExtraction(this.props.children, this.getPatterns());

    return textExtraction.parse().map((props, index) => {
        if(props.children.indexOf("*") === 0 && (props.children.indexOf("_") !== -1 || props.children.indexOf("~") !== -1)) {
            return this.getExtracton(props.children);
        }
        if(props.children.indexOf("_") === 0 && (props.children.indexOf("*") !== -1 || props.children.indexOf("~") !== -1)) {
            return this.getExtracton(props.children);
        }
        if(props.children.indexOf("~") === 0 && (props.children.indexOf("*") !== -1 || props.children.indexOf("_") !== -1)) {
            return this.getExtracton(props.children);
        }
      props.children = props.children.split("*").join("").split("_").join("").split("~").join("");
      return (
        <ReactNative.Text
          key={`parsedText-${index}`}
          {...this.props.childrenProps}
          {...props}
        />
      );
    });
  }

  render() {
    // Discard custom props before passing remainder to ReactNative.Text
    const { parse, childrenProps, ...remainder } = { ...this.props };

    return (
      <ReactNative.Text ref={ref => (this._root = ref)} {...remainder}>
        {this.getParsedText()}
      </ReactNative.Text>
    );
  }
}

export default ParsedText;
