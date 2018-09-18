function defineFuncForTabSpacing() {
  ////ONLY FOR BROWSER /////
  const widget = {};



  ////////// Hard Coded Defs //////////
  let cxGaugeCounter = 0;

  const resetElements = (outerWidgetEl, elementsToReset) => {
    const selectionForCheck = outerWidgetEl.selectAll(elementsToReset)
    if (!selectionForCheck.empty()) selectionForCheck.remove();
  };




  ////////////////////////////////////////////////////////////////
  // Define Widget Constructor & Exposed Properties
  ////////////////////////////////////////////////////////////////
  const properties = [
    {
      name: 'gaugeTitle1',
      value: 'Gauge Title1'
    },
    {
      name: 'gaugeTitle2',
      value: 'Gauge Title2'
    },
    {
      name: 'baselineEfficiencyThreshold',
      value: 1.20
    },
    {
      name: 'targetEfficiencyThreshold',
      value: 0.80
    },
    {
      name: 'title1SpacingFromMiddle',
      value: 30
    },
    {
      name: 'title2SpacingFromMiddle',
      value: 10
    },
    {
      name: 'valueSpacingFromMiddle',
      value: 15
    },
    {
      name: 'minVal',
      value: 0
    },
    {
      name: 'maxVal',
      value: 2
    },
    {
      name: 'gaugeArcThickness',
      value: 18
    },
    {
      name: 'titleFont',
      value: '12.0pt Nirmala UI',
      typeSpec: 'gx:Font'
    },
    {
      name: 'unitsFont',
      value: '11.0pt Nirmala UI',
      typeSpec: 'gx:Font'
    },
    {
      name: 'valueFont',
      value: 'bold 22.0pt Nirmala UI',
      typeSpec: 'gx:Font'
    },
    {
      name: 'backgroundColor',
      value: 'rgb(245,245,245)',
      typeSpec: 'gx:Color'
    },
    {
      name: 'nominalGaugeArcColor',
      value: 'rgb(34,181,115)',
      typeSpec: 'gx:Color'
    },
    {
      name: 'subTargetGaugeArcColor',
      value: 'rgb(250,215,50)',
      typeSpec: 'gx:Color'
    },
    {
      name: 'subBaselineGaugeArcColor',
      value: 'rgb(213,61,59)',
      typeSpec: 'gx:Color'
    },
    {
      name: 'titleColor',
      value: 'rgb(64,64,64)',
      typeSpec: 'gx:Color'
    },
    {
      name: 'unitsColor',
      value: 'rgb(64,64,64)',
      typeSpec: 'gx:Color'
    },
    {
      name: 'valueColor',
      value: 'rgb(64,64,64)',
      typeSpec: 'gx:Color'
    },
    {
      name: 'backgroundArcColor',
      value: 'rgb(212,212,212)',
      typeSpec: 'gx:Color'
    }
  ];


  ////////////////////////////////////////////////////////////////
  // /* SETUP DEFINITIONS AND DATA */
  ////////////////////////////////////////////////////////////////

  const setupDefinitions = () => {
    let cx, cy, width, height, startAngle, endAngle, gaugeArcOuterRadius,
      gaugeArcInnerRadius, minValForArc, maxValForArc, valForGaugeArc, minVal, maxVal,
      efficiencyColorScale, angleScale, gaugeArcGenerator, backgroundArcGenerator,
      unitsArcGenerator, arcTween;
    // FROM USER // 
    const data = {};
    properties.forEach(prop => data[prop.name] = prop.value);

    // FROM JQ //
    const jqHeight = 200;
    const jqWidth = 200;
    data.svgWidth = jqWidth - 2
    data.svgHeight = jqHeight - 2
    width = data.svgWidth;
    height = data.svgHeight;

    // CALCULATED OR HARD-CODED DEFINITIONS //
    data.lastValue = widget.valToStartArcTransition;
    cx = width / 2;
    cy = height / 2;
    // angles are measured in radians (pi * 2 radians === full circle, so in radians, 0 === 2 * pi)
    startAngle = - Math.PI;
    endAngle = Math.PI;
    gaugeArcOuterRadius = height < width ? (height / 2) - 5 : (width / 2) - 5;
    gaugeArcInnerRadius = gaugeArcOuterRadius - data.gaugeArcThickness;

    // sets value data
    data.units = 'kW / tR';
    data.precision = 2;
    data.value = 0;

    // implements value limit for gauge arc display so that never completely empty
    valForGaugeArc = data.value;
    minValForArc = data.minVal + ((data.maxVal - data.minVal) * (0.95));
    maxValForArc = data.maxVal - ((data.maxVal - data.minVal) * (0.97));

    if (data.value > minValForArc) {
      valForGaugeArc = minValForArc;
    }
    if (data.value < maxValForArc) {
      valForGaugeArc = maxValForArc;
    }



    // to provide start point for next transition to use
    widget.valToStartArcTransition = valForGaugeArc;

    //invert min and max vals for eff gauge
    [minVal, maxVal] = [data.maxVal, data.minVal];

    // func returns which color arc fill should be based on curr val, efficiency thresholds, and selected arc colors for up to baseline, up to target, & nominal vals
    efficiencyColorScale = currentValue => {
      if (currentValue >= data.baselineEfficiencyThreshold) return data.subBaselineGaugeArcColor;
      if (currentValue >= data.targetEfficiencyThreshold) return data.subTargetGaugeArcColor;
      return data.nominalGaugeArcColor;
    };
    // returns scaling func that returns angle in radians for a value
    angleScale = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([startAngle, endAngle]);

    // Arc Generators return d values for paths
    gaugeArcGenerator = d3.arc()
      .startAngle(startAngle)
      .innerRadius(gaugeArcInnerRadius)
      .outerRadius(gaugeArcOuterRadius)
      .cornerRadius('10'); // round edges of path

    backgroundArcGenerator = d3.arc()
      .startAngle(startAngle)
      .endAngle(endAngle)
      .innerRadius(gaugeArcInnerRadius)
      .outerRadius(gaugeArcOuterRadius);

    unitsArcGenerator = d3.arc()
      .startAngle(endAngle)
      .endAngle(startAngle)
      .innerRadius(gaugeArcInnerRadius - (gaugeArcInnerRadius * 0.05))
      .outerRadius(gaugeArcInnerRadius - (gaugeArcInnerRadius * 0.05));

		/* func that returns func that returns return val of gaugeArcGenerator invoked on data with
				'end angle' property of interpolated start & end end angles for drawing arc transition */
    arcTween = newAngle => datum => t => {
      datum.endAngle = d3.interpolate(datum.endAngle, newAngle)(t);
      return gaugeArcGenerator(datum);
    };
    const tempObj = {
      cx, cy, width, height, startAngle, endAngle, gaugeArcOuterRadius,
      gaugeArcInnerRadius, minValForArc, maxValForArc, valForGaugeArc, minVal, maxVal,
      efficiencyColorScale, angleScale, gaugeArcGenerator, backgroundArcGenerator,
      unitsArcGenerator, arcTween
    }
    Object.keys(tempObj).forEach(prop => { data[prop] = tempObj[prop] });
    return data;
  };





  ////////////////////////////////////////////////////////////////
  // RenderWidget Func
  ////////////////////////////////////////////////////////////////

  const renderWidget = data => {
    let {
      cx, cy, width, height, startAngle, endAngle, gaugeArcOuterRadius, gaugeTitle1, gaugeTitle2,
      gaugeArcInnerRadius, minValForArc, maxValForArc, valForGaugeArc, minVal, maxVal, baselineEfficiencyThreshold,
      efficiencyColorScale, angleScale, gaugeArcGenerator, backgroundArcGenerator, targetEfficiencyThreshold,
      unitsArcGenerator, arcTween, valueSpacingFromMiddle, title1SpacingFromMiddle, title2SpacingFromMiddle,
      gaugeArcThickness, titleFont, unitsFont, valueFont, backgroundColor, nominalGaugeArcColor, subTargetGaugeArcColor,
      subBaselineGaugeArcColor, titleColor, unitsColor, valueColor, backgroundArcColor
    } = data;

    data.lastValue = data.lastValue || data.lastValue === 0 ? data.lastValue : minValForArc;

    // ********************************************* DRAW ******************************************************* //
    widget.outerDiv
      .style('height', data.jqHeight + 'px')	//only for browser
      .style('width', data.jqWidth + 'px')		//only for browser

    const svg = widget.svg
      .attr('height', data.svgHeight + 'px')
      .attr('width', data.svgWidth + 'px')

    d3.select(svg.node().parentNode).style('background-color', data.backgroundColor);

    // delete leftover elements from versions previously rendered
    if (!svg.empty()) resetElements(svg, '*');

    // ********************************************* GRAPHIC GROUP ******************************************************* //
    const valueOutput = svg.append('text')
      .attr('class', 'valueOutput')
      .attr('x', cx)
      .attr('y', cy + valueSpacingFromMiddle)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', valueColor)
      .style('font', valueFont)
      // formats output num using precision from value facets
      .text(d3.format(`,.${data.precision}f`)(data.value));

    const chartGroup = svg.append('g')
      .attr('class', 'chartGroup')
      .attr('transform', `translate(${cx}, ${cy})`);

    const backgroundPath = chartGroup.append('path')
      .attr('id', widget.uniqueId + '_backgroundPath')
      .attr('d', backgroundArcGenerator())
      .attr('fill', data.backgroundArcColor);


    const gaugeArc = chartGroup.append('path')
      .attr('id', 'gaugeArc')
      .datum({ endAngle: angleScale(data.lastValue) })
      // fill 3 color scale for efficiency gauge. Starts with min val color prior to transition
      .attr('fill', efficiencyColorScale(data.lastValue))
      .attr('d', gaugeArcGenerator(angleScale(data.lastValue)))
      .transition()
      .duration(1000)
      // for efficiency graph, transition from min val scale color to actual val's scale color
      .attr('fill', efficiencyColorScale(data.value))
      // gradually transition end angle from minValForArc to true val angle
      .attrTween('d', arcTween(angleScale(valForGaugeArc)));

    const unitsPath = chartGroup.append('path')
      .attr('id', widget.uniqueId + '_unitsPath')
      .attr('d', unitsArcGenerator())
      .attr('fill', 'none');

    const title1Output = chartGroup.append("text")
      .attr('dominant-baseline', 'text-after-edge')
      .style("text-anchor", "middle")
      .attr('y', -(title1SpacingFromMiddle))
      .style('font', titleFont)
      .attr('fill', titleColor)
      .text(gaugeTitle1);

    const title2Output = chartGroup.append("text")
      .attr('dominant-baseline', 'text-after-edge')
      .style("text-anchor", "middle")
      .attr('y', -(title2SpacingFromMiddle))
      .style('font', titleFont)
      .attr('fill', titleColor)
      .text(gaugeTitle2);

    const unitsOutput = chartGroup.append("text").append("textPath")
      .attr("xlink:href", '#' + widget.uniqueId + '_unitsPath') // ID of path text follows
      .style("text-anchor", "end")
      .attr("startOffset", "50%")
      .style('font', unitsFont)
      .attr('fill', unitsColor)
      .text(data.units);


  const theData = setupDefinitions();

  widget.data = theData;


  };







////////////////////////////////////////////////////////////////
// Render Func
////////////////////////////////////////////////////////////////
function render() {
  let theData = setupDefinitions();
  renderWidget(theData);
}








////////////////////////////////////////////////////////////////
// Initialize Widget
////////////////////////////////////////////////////////////////
widget.outerDiv = d3.select('#outer')
  .style('overflow', 'hidden');

widget.svg = widget.outerDiv.append('svg')
  .attr('class', 'log')
  .style('overflow', 'hidden');

widget.uniqueId = 'CxGauge_' + cxGaugeCounter;
cxGaugeCounter++;

render();







}

defineFuncForTabSpacing();