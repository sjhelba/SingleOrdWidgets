/* NOTE FOR FUTURE USE:
const degreesToRadians = deg => (deg * Math.PI) / 180;
*/



/* EXPOSED PROPERTIES */

var gaugeTitle1 = 'System';
var gaugeTitle2 = 'Efficiency'
var efficiencyGauge = true;
var decimalPlaces = 2;

var baselineEfficiencyThreshold = 1.20;
var targetEfficiencyThreshold = 0.80;
var value = 1;  // example kW / tR
var units = 'kW / tR';
var minVal = 0;
var maxVal = 2;


var gaugeArcThickness = 23

var titleFont = '12.0pt Nirmala UI';
var unitsFont = '11.0pt Nirmala UI';
var valueFont = 'bold 28.0pt Nirmala UI';

var backgroundColor = 'white';
// if efficiencyGauge is true, will utilize efficiencyColorScale for arc fill (all 3 gaugeArcColors), else only nominalGaugeArcColor
var nominalGaugeArcColor = '#21A75D'
var subTargetGaugeArcColor = '#ffd829'
var subBaselineGaugeArcColor = '#c01616'
var titleColor = '#000000';
var unitsColor = '#75757a';
var valueColor = '#000000';
var backgroundArcColor = 'lightGray'
var title1SpacingFromMiddle = 35;
var title2SpacingFromMiddle = 18;
var valueSpacingFromMiddle = 11;



/***** MAKE ALL SIZING RELATIVE TO THESE. WILL CHANGE TO JQ VALUES FOR NIAGARA *****/
var height = '200';
var width = '200';
/***** MAKE ALL SIZING RELATIVE TO THESE. WILL CHANGE TO JQ VALUES FOR NIAGARA *****/




/* SETUP DEFINITIONS */
var cx = width / 2;
var cy = height / 2;
// angles are measured in radians (pi * 2 radians === full circle, so in radians, 0 === 2 * pi)
var startAngle =  - Math.PI;
var endAngle = Math.PI;
var gaugeArcOuterRadius = height < width ? (height / 2) - 5 : (width / 2) - 5;
var gaugeArcInnerRadius = gaugeArcOuterRadius - gaugeArcThickness;

// implements value limit for gauge arc display so that never completely empty
let valForGaugeArc = value;
const minValForArc = minVal + ((maxVal - minVal) * (efficiencyGauge ? 0.95 : 0.05));
const maxValForArc = maxVal - ((maxVal - minVal) * (efficiencyGauge ? 0.97 : 0.03));
if (efficiencyGauge) {
    if (value > minValForArc) {
        valForGaugeArc = minValForArc;
    }
    if (value < maxValForArc) {
        valForGaugeArc = maxValForArc;
    }
} else {
    if (value < minValForArc) {
        valForGaugeArc = minValForArc;
    }
    if (value > maxValForArc) {
        valForGaugeArc = maxValForArc;
    }
}
// if efficiencyGauge marked true, inverts min and max vals
if (efficiencyGauge) var [minVal,maxVal] = [maxVal,minVal];

// func returns which color arc fill should be based on curr val, efficiency thresholds, and selected arc colors for up to baseline, up to target, & nominal vals
const efficiencyColorScale = currentValue => {
    if (currentValue >= baselineEfficiencyThreshold) return subBaselineGaugeArcColor;
    if (currentValue >= targetEfficiencyThreshold) return subTargetGaugeArcColor;
    return nominalGaugeArcColor;
};
// returns scaling func that returns angle in radians for a value
const angleScale = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([startAngle, endAngle]);

// Arc Generators return d values for paths
const gaugeArcGenerator = d3.arc()
    .startAngle(startAngle)  
    .innerRadius(gaugeArcInnerRadius)
    .outerRadius(gaugeArcOuterRadius)
    .cornerRadius('10'); // round edges of path

const backgroundArcGenerator = d3.arc()
    .startAngle(startAngle)
    .endAngle(endAngle)
    .innerRadius(gaugeArcInnerRadius)
    .outerRadius(gaugeArcOuterRadius);

const unitsArcGenerator = d3.arc()
    .startAngle(endAngle)
    .endAngle(startAngle)
    .innerRadius(gaugeArcInnerRadius - (gaugeArcInnerRadius * .05))
    .outerRadius(gaugeArcInnerRadius - (gaugeArcInnerRadius * .05));

// func that returns func that returns return val of gaugeArcGenerator invoked on data with 'end angle' property of interpolated start & end end angles for drawing arc transition
// [ adapted from Mike Bostok's http://bl.ocks.org/mbostock/5100636 ]
const arcTween = newAngle => datum => t => {
    datum.endAngle = d3.interpolate(datum.endAngle, newAngle)(t);
    return gaugeArcGenerator(datum);
};


/* APPEND D3 ELEMENTS INTO SVG */


const svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

const graphicGroup = svg.append('g')

const backgroundRect = graphicGroup.append('rect')
  	.attr('id', 'background')
  	.attr('x', 0)
  	.attr('y', 0)
  	.attr('width', '100%')
  	.attr('height', '100%')
  	.attr('stroke-width', '0')
  	.attr('fill', backgroundColor);
    
const valueOutput = graphicGroup.append('text')
    .attr('class', 'valueOutput')
    .attr('x', cx)
    .attr('y', cy + valueSpacingFromMiddle)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', valueColor)
    .style('font', valueFont)
    // formats output num using num of decimal places user input
    .text(d3.format(`,.${decimalPlaces}f`)(value));

const chartGroup = graphicGroup.append('g')
    .attr('class', 'chartGroup')
    .attr('transform', `translate(${cx}, ${cy})`);


const backgroundPath = chartGroup.append('path')
    .attr('id', 'backgroundPath')
    .attr('d', backgroundArcGenerator())
    .attr('fill', backgroundArcColor);

const gaugeArc = chartGroup.append('path')
    .attr('id', 'gaugeArc')
    .datum({endAngle: angleScale(minValForArc)})
    // fill nominal color for non-efficiency gauge or 3 color scale for efficiency gauge. Starts with min val color prior to transition
    .attr('fill', efficiencyGauge ? efficiencyColorScale(minValForArc) : nominalGaugeArcColor)
    .attr('d', gaugeArcGenerator(angleScale(minValForArc)))
    .transition()
        .duration(1000)
        // if efficiency graph, transition from min val scale color to actual val's scale color
        .attr('fill', efficiencyGauge ? efficiencyColorScale(value) : nominalGaugeArcColor)
        // gradually transition end angle from minValForArc to true val angle
        .attrTween('d', arcTween(angleScale(valForGaugeArc)));


const unitsPath = chartGroup.append('path')
    .attr('id', 'unitsPath')
    .attr('d', unitsArcGenerator())
    .attr('fill', 'none');

const title1Output = chartGroup.append("text")
    .attr('dominant-baseline', 'text-after-edge')
    .attr('y', -(title1SpacingFromMiddle))
    .style("text-anchor","middle")
    .style('font', titleFont)
    .attr('fill', titleColor)
    .text(gaugeTitle1);

const title2Output = chartGroup.append("text")
    .attr('dominant-baseline', 'text-after-edge')
    .attr('y', -(title2SpacingFromMiddle))
    .style("text-anchor","middle")
    .style('font', titleFont)
    .attr('fill', titleColor)
    .text(gaugeTitle2);

const unitsOutput = chartGroup.append("text").append("textPath")
    .attr("xlink:href", "#unitsPath") // ID of path text follows
    .style("text-anchor","end")
    .attr("startOffset", "50%")
    .style('font', unitsFont)
    .attr('fill', unitsColor)
    .text(units);
