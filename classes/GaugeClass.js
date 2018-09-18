
class Gauge {
	constructor(elementToAppendGaugeTo, timerType = 'On', onReason = 'Temperature', preset = 15, timeLeft = 15, height = 125, width = 125) {
    this.timerType = timerType // On, Off, COS, or Standby
    this.onReason = onReason // Efficiency, Temperature, or Flow
    this.height = height;
    this.width = width;
		this.timeLeft = timeLeft;
    this.previoustimeLeft = timeLeft;
    this.margin = 5;
    this.verticalPadding = 5;
    this.backgroundArcColor = '#e0ebeb';
    this.startAngle = -Math.PI;
    this.endAngle = Math.PI;
    this.gaugeArcThickness = 15;
    this.title1Font = 'bold 13.0pt Nirmala UI';	// Niagara: 18
    this.title2Font = '10.0pt Nirmala UI';	// Niagara: 14
    this.minVal = 0; //secondsCountingFrom if timer
    this.maxVal = preset;
    this.calculateCalculatedProps();
    this.element = elementToAppendGaugeTo.append('g')
      .attr('class', 'gaugeElement')
      .attr('transform', `translate(${this.margin}, ${this.margin})`);
	}

	create() {

    const chartGroup = this.element.append('g')
      .attr('class', 'chartGroup')
      .attr('transform', `translate(${this.cx}, ${this.cy})`);

    //backgroundPath
    chartGroup.append('path')
      .attr('class', 'backgroundPath')
      .attr('d', this.backgroundArcGenerator())
      .attr('fill', this.backgroundArcColor);

    //gaugeArc
    chartGroup.append('path')
      .attr('class', 'gaugeArc')
      .datum({ endAngle: this.angleScale(this.previoustimeLeft) })
      .attr('fill', this.foregroundArcColor)
      .attr('d', this.gaugeArcGenerator(this.angleScale(this.previoustimeLeft)))
      .transition()
        .duration(250)
        // gradually transition end angle from minValForArc to true val angle
        .attrTween('d', this.arcTween(this.angleScale(this.timeLeft)));

    //title1
    if (this.timerType === 'Standby') {
      chartGroup.append('line')
        .attr('x1', -10)
        .attr('x2', 10)
        .attr('y1', this.title1Y - 10)
        .attr('y2', this.title1Y - 10)
        .attr('stroke', 'black')

    } else {
      chartGroup.append("text")
        .attr('dominant-baseline', 'text-after-edge')
        .style("text-anchor", "middle")
        .attr('y', this.title1Y)
        .style('font', this.title1Font)
        .text(this.title1);
    }

    if (this.timerType === 'On' || this.timerType === 'Standby') {
      //title2
      chartGroup.append("text")
        .attr('dominant-baseline', 'text-after-edge')
        .style("text-anchor", "middle")
        .attr('y', this.title2Y)
        .style('font', this.title2Font)
        .text(this.timerType === 'Standby' ? 'Standby' : this.timeLeft === 0 ? '' : this.onReason);
    }


    return this.element;
  }
  
  delete() {
    this.element.remove();
  }

  calculateCalculatedProps() {
    this.title1 = this.timeLeft === 0 ? '' : this.timeLeft <= 10 ? this.timeLeft + ' sec' : this.timerType;
    if (this.timerType === 'On' || this.timerType === 'Standby') {
      this.title1Y = -(this.verticalPadding / 2);
      this.title2Y = (this.verticalPadding / 2) + JsUtils.getTextHeight(this.title2Font);
      this.foregroundArcColor = '#feb550';
    } else {
      this.title1Y = JsUtils.getTextHeight(this.title1Font) / 2;
      this.foregroundArcColor = this.timerType === 'Off' ? '#425867' : this.timerType === 'COS' ? '#404040' : 'none';
    }

    this.gaugeArcOuterRadius = this.height < this.width ? (this.height / 2) - 5 : (this.width / 2) - 5;
    this.gaugeArcInnerRadius = this.gaugeArcOuterRadius - this.gaugeArcThickness;
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.backgroundArcGenerator = d3.arc()
      .startAngle(this.startAngle)
      .endAngle(this.endAngle)
      .innerRadius(this.gaugeArcInnerRadius)
      .outerRadius(this.gaugeArcOuterRadius);
    // returns scaling func that returns angle in radians for a value
    this.angleScale = d3.scaleLinear()
      .domain([this.minVal, this.maxVal])
      .range([this.startAngle, this.endAngle]);
    // Arc Generators return d values for paths
    this.gaugeArcGenerator = d3.arc()
      .startAngle(this.startAngle)
      .innerRadius(this.gaugeArcInnerRadius)
      .outerRadius(this.gaugeArcOuterRadius)
      .cornerRadius('10'); // round edges of path

    /* func that returns func that returns return val of gaugeArcGenerator invoked on data with
    'end angle' property of interpolated start & end end angles for drawing arc transition */
    this.arcTween = newAngle => datum => t => {
      datum.endAngle = d3.interpolate(datum.endAngle, newAngle)(t);
      return this.gaugeArcGenerator(datum);
};
  }

  //  {paramName: newArg, paramName: newArg, paramName: newArg}
  redrawWithNewArgs(newArgsObj) {
    const that = this;
    JsUtils.resetElements(that.element, '*');
    that.previoustimeLeft = that.timeLeft;
    let count = 0;
    for (let param in newArgsObj) {
      if (newArgsObj.hasOwnProperty(param)) {
        that[param] = newArgsObj[param];
        count++;
      }
    }
    // if more than one property has changed (thus properties other than timeLeft have changed), don't start at previous value
    if (count > 1) {
      that.previoustimeLeft = that.timeLeft
    }
    that.calculateCalculatedProps();
    that.create();
  }

}
