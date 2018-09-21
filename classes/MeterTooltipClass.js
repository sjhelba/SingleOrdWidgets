class MeterTooltip {
	constructor(meter, elementToAppendTo) {
    this.meter = meter;
    this.margin = 3;
    this.minRightOfLabel = 8;
    this.rightOfNum = 3;
    this.verticalPadding = 3;
    this.rightOfTitle = 10;
    this.calculateCalculatedProps();
    this.element = elementToAppendTo.append('g')
      .attr('class', 'tooltipGroup')
      .style('display', 'none');
  }

  calculateCalculatedProps() {
    this.height = (this.margin * 3) + (JsUtils.getTextHeight(this.meter.titleFont) * (this.meter.isDesignVal ? 4 : 3) ) + ( this.verticalPadding * (this.meter.isDesignVal ? 3 : 2) );
    this.width = (this.margin * 2) + (this.rightOfTitle * 2) + JsUtils.getTextWidth(this.meter.isDesignVal ? 'Design:' : 'Max:', this.meter.titleFont) + this.minRightOfLabel + this.meter.greatestNumWidth + this.rightOfNum + JsUtils.getTextWidth(this.meter.units, this.meter.unitsFont);
  }

  create(areNewArgs) {
    
    //if there's a change, recalculate height and width
    if (areNewArgs) this.calculateCalculatedProps();

    //rect
    this.element.append('rect')
      .attr('fill', this.meter.backgroundBarColor)
      .attr('stroke', 'none')
      .attr('height', this.height)
      .attr('width', this.width)
      .attr('rx', 5)
      .attr('ry', 5);
    const textGroup = this.element.append('g')
      .attr('class', 'textGroup')
      .attr('transform', `translate(${this.margin}, ${this.margin})`);
    //title
    textGroup.append('text')
      .text(this.meter.title)
      .style('font', 'bold ' + this.meter.titleFont)
      .attr('y', JsUtils.getTextHeight('bold ' + this.meter.titleFont))
    
    const row0 = textGroup.append('g')
      .attr('class', 'labelsColumn')
      .attr('transform', `translate(0, ${JsUtils.getTextHeight(this.meter.numFont)})`);
    const row1 = textGroup.append('g')
      .attr('class', 'labelsColumn')
      .attr('transform', `translate(0, ${( JsUtils.getTextHeight(this.meter.numFont) * 2 ) + this.verticalPadding})`);
    const row2 = textGroup.append('g')
      .attr('class', 'numsColumn')
      .attr('transform', `translate(0, ${( JsUtils.getTextHeight(this.meter.numFont) * 3 ) + (this.verticalPadding * 2)})`);
    const row3 = !this.meter.isDesignVal ? undefined : textGroup.append('g')
      .attr('class', 'unitsColumn')
      .attr('transform', `translate(0, ${( JsUtils.getTextHeight(this.meter.numFont) * 4 ) + (this.verticalPadding * 3)})`);

    const labelsColumnX = this.rightOfTitle;
    const numsColumnX = this.rightOfTitle + JsUtils.getTextWidth(this.meter.isDesignVal ? 'Design:' : 'Max:', this.meter.titleFont) + this.minRightOfLabel;

    //Min Label
    row1.append('text')
      .text('Min:')
      .style('font', this.meter.titleFont)
      .attr('x', labelsColumnX);
    //Min Val
    row1.append('text')
      .text(JsUtils.formatValueToPrecision(this.meter.minVal, this.meter.precision))
      .style('font', this.meter.numFont)
      .attr('x', numsColumnX);
    //Min Units
    row1.append('text')
      .text(this.meter.units)
      .style('font', this.meter.unitsFont)
      .attr('x', numsColumnX + JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.meter.minVal, this.meter.precision), this.meter.numFont) + this.rightOfNum);

    if (this.meter.isDesignVal) {
      //Design Label
      row2.append('text')
        .text('Design:')
        .style('font', this.meter.titleFont)
        .attr('x', labelsColumnX)
      //Design Val
      row2.append('text')
        .text(JsUtils.formatValueToPrecision(this.meter.designVal, this.meter.precision))
        .style('font', this.meter.numFont)
        .attr('x', numsColumnX)
      //Design Units
      row2.append('text')
        .text(this.meter.units)
        .style('font', this.meter.unitsFont)
        .attr('x', numsColumnX + JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.meter.designVal, this.meter.precision), this.meter.numFont) + this.rightOfNum);

      //Max Label
      row3.append('text')
        .text('Max:')
        .style('font', this.meter.titleFont)
        .attr('x', labelsColumnX);
      //Max Val
      row3.append('text')
        .text(JsUtils.formatValueToPrecision(this.meter.maxVal, this.meter.precision))
        .style('font', this.meter.numFont)
        .attr('x', numsColumnX);
      //Max Units
      row3.append('text')
        .text(this.meter.units)
        .style('font', this.meter.unitsFont)
        .attr('x', numsColumnX + JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.meter.maxVal, this.meter.precision), this.meter.numFont) + this.rightOfNum);
    } else {
      //Max Label
      row2.append('text')
        .text('Max:')
        .style('font', this.meter.titleFont)
        .attr('x', labelsColumnX);
      //Max Val
      row2.append('text')
        .text(JsUtils.formatValueToPrecision(this.meter.maxVal, this.meter.precision))
        .style('font', this.meter.numFont)
        .attr('x', numsColumnX);
      //Max Units
      row2.append('text')
        .text(this.meter.units)
        .style('font', this.meter.unitsFont)
        .attr('x', numsColumnX + JsUtils.getTextWidth(JsUtils.formatValueToPrecision(this.meter.maxVal, this.meter.precision), this.meter.numFont) + this.rightOfNum);
    }


  }

	show() {
    this.element.style('display', 'block')
  }

  hide() {
    this.element.style('display', 'none')
  }

}