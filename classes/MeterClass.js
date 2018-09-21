
class Meter {
	constructor(elementToAppendMeterTo, elementToAppendTooltipTo, backgroundColor, foregroundBarColor, fontColor, height, width, title, units, precision, titleFont, unitsFont, numFont, meterVal, minVal, maxVal, hasTooltip, designVal, isCurrentlyHovered) {
		this.backgroundColor = backgroundColor;
		this.foregroundBarColor = foregroundBarColor;
		this.height = height;
		this.width = width;
		this.title = title;
		this.units = units;
		this.precision = precision;
    this.titleFont = titleFont;
    this.unitsFont = unitsFont;
    this.numFont = numFont;
		this.meterVal = meterVal;
		this.minVal = minVal;
		this.maxVal = maxVal;
    this.designVal = designVal;
    this.margin = 3;
		this.horizontalTextPadding = 3;
		this.verticalTextPadding = 2;
		this.backgroundBarColor = '#e0ebeb';
		this.textColor = fontColor;
		this.isCurrentlyHovered = isCurrentlyHovered;
    this.previousMeterVal = this.meterVal;
		this.calculateCalculatedProps();
		this.hasTooltip = hasTooltip;
		if (hasTooltip) this.tooltip = new MeterTooltip(this, elementToAppendTooltipTo);
    this.element = elementToAppendMeterTo.append('g')
      .attr('class', 'meterElement')
      .attr('transform', `translate(${this.margin}, ${this.margin})`);
	}

  calculateCalculatedProps() {
    this.heights = {title: JsUtils.getTextHeight(this.titleFont), units: JsUtils.getTextHeight(this.unitsFont), num: JsUtils.getTextHeight(this.numFont)};
    this.isDesignVal = this.designVal || this.designVal === 0 ? true : false;
		this.greatestTextHeight = d3.max([JsUtils.getTextHeight(this.titleFont), JsUtils.getTextHeight(this.unitsFont), JsUtils.getTextHeight(this.numFont)]);
    this.greatestNumWidth = d3.max([JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.minVal, this.precision), this.numFont), JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.maxVal, this.precision), this.numFont), this.isDesignVal ? JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.designVal, this.precision), this.numFont) : 0]);
    this.barLength = this.width - (this.margin * 2);
    this.barHeight = this.height - ( (this.margin * 2) + this.greatestTextHeight + this.verticalTextPadding );
  }

	create(areNewArgs) {
		if (this.hasTooltip) {
			const myTooltip = this.tooltip;
			myTooltip.create(areNewArgs);
			if (this.isCurrentlyHovered) myTooltip.show();
		}

		const barGroup = this.element.append('g')
			.attr('class', 'barGroup')
			.attr('transform', `translate(0, ${this.greatestTextHeight + this.verticalTextPadding})`)
		//backgroundBar
		barGroup.append('rect')
			.attr('class', 'backgroundBar')
			.attr('height', this.barHeight)
			.attr('width', this.barLength)
			.attr('fill', this.backgroundBarColor)
			.attr('stroke', 'none')
			.attr('rx', 5)
			.attr('ry', 5);
		//foregroundBar
		barGroup.append('rect')
			.attr('class', 'foregroundBar')
			.attr('height', this.barHeight)
			.attr('width', scaleValue(this.previousMeterVal, this.minVal, this.maxVal, this.barLength))
			.attr('fill', this.foregroundBarColor)
			.attr('stroke', 'none')
			.attr('rx', 5)
      .attr('ry', 5)
      .transition()
        .attr('width', scaleValue(this.meterVal, this.minVal, this.maxVal, this.barLength));
      
		if (this.isDesignVal) {
			//designValBar
			barGroup.append('rect')
				.attr('class', 'designValBar')
				.attr('height', this.barHeight + (this.barHeight / 2))
				.attr('width', this.barHeight * 0.4)
				.attr('x', scaleValue(this.designVal, this.minVal, this.maxVal, this.barLength))
				.attr('y', -(this.barHeight / 4))
				.attr('fill', '#f5f5f5')
				.attr('stroke', 'none');
		}
		// invisible hoverable bar
		barGroup.append('rect')
			.attr('class', 'invisibleHoverableBar')
			.attr('height', this.barHeight)
			.attr('width', this.barLength)
			.attr('opacity', '0')
			.attr('rx', 5)
			.attr('ry', 5)

		const textGroup = this.element.append('g')
			.attr('class', 'textGroup')
			.attr('transform', `translate(0, ${this.greatestTextHeight})`)
			.style('cursor', 'default')
			
		//meterValText
		textGroup.append('text')
			.attr('class', 'meterValText')
			.style('font', this.numFont)
			.text(JsUtils.formatValueToPrecision(this.previousMeterVal, this.precision))
			.attr('fill', this.textColor)
      .attr('x', 0)
      .transition()
        .text(JsUtils.formatValueToPrecision(this.meterVal, this.precision))

		//unitsText
		textGroup.append('text')
			.attr('class', 'unitsText')
			.style('font', this.unitsFont)
			.text(this.units)
			.attr('fill', this.textColor)
      .attr('x', JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.previousMeterVal, this.precision), this.numFont) + this.horizontalTextPadding)
      .transition()
        .attr('x', JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.meterVal, this.precision), this.numFont) + this.horizontalTextPadding)

		//titleText
		textGroup.append('text')
			.attr('class', 'titleText')
			.style('font', this.titleFont)
			.text(this.title)
			.attr('fill', this.textColor)
			.attr('text-anchor', 'end')
			.attr('x', this.width - this.margin)


		function scaleValue(value, minVal, maxVal, barLength) {
			var x = d3.scaleLinear().domain([minVal, maxVal]).range([0, barLength]);
			return x(value);
    }

    return this.element;
  }
  
  delete() {
    this.tooltip.element.remove();
    this.element.remove();
  }

	callbackOnHover(func) {
		const myTooltip = this.tooltip;
		const hasTooltip = this.hasTooltip;
		this.element.on('mouseover', function() {
			if (hasTooltip) myTooltip.show();
			func();
		})
	}

	callbackOnUnhover(func) {
		const myTooltip = this.tooltip;
		const hasTooltip = this.hasTooltip;
		this.element.on('mouseout', function() {
			if (hasTooltip) myTooltip.hide();
			func();
		});
	}

	static getHeightFromMeterHeight(meterHeight, titleFont, unitsFont, numFont) {
		return meterHeight + d3.max([JsUtils.getTextHeight(titleFont), JsUtils.getTextHeight(unitsFont), JsUtils.getTextHeight(numFont)]) + 6 + 2;
	}

  //  {paramName: newArg, paramName: newArg, paramName: newArg}
  redrawWithNewArgs(newArgsObj) {
		const that = this;

			if (this.hasTooltip) {
				JsUtils.resetElements(that.tooltip.element, '*');
			}
			JsUtils.resetElements(that.element, '*');
			that.previousMeterVal = that.meterVal;
			let count = 0;
			for (let param in newArgsObj) {
				if (newArgsObj.hasOwnProperty(param)) {
					that[param] = newArgsObj[param];
					count++;
				}
			}
			// if more than one property has changed (thus properties other than meterVal have changed), don't use previous value
			if (count > 1) {
				that.previousMeterVal = that.meterVal
			}

			that.calculateCalculatedProps();
			that.create(true);
		}

}
