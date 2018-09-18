define(['nmodule/COREx/rc/d3/d3.min', 'baja!',], function (d3, baja) {

  class JsUtils {
    static getJSDateFromTimestamp(timeStamp) {
      return d3.utcParse('%d-%b-%y %I:%M:%S.%L %p UTC%Z')(timeStamp);
    }

    static formatIntoPercentage(num) {
      return d3.format('.0%')(num);
    }
      
    static getTextWidth(text, font) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = font;
      const width = context.measureText(text).width;
      d3.select(canvas).remove()
      return width;
    }

    static getTextHeight(font) {
      let num = '';
      const indexOfLastDigit = font.indexOf('pt') - 1;
      for (let i = 0; i <= indexOfLastDigit; i++){
        if (!isNaN(font[i]) || font[i] === '.') num += font[i];
      }
      num = +num;
      return num * 1.33333333333;
    }

    static resetElements(outerWidgetEl, elementsToReset) {
      const selectionForCheck = outerWidgetEl.selectAll(elementsToReset)
      if (!selectionForCheck.empty()) selectionForCheck.remove();
    }

    static formatValueToPrecision(value, precision) {
      return d3.format(',.' + precision + 'f')(value);
    } 

  }


  return JsUtils;

});

