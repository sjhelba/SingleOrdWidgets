define(['bajaux/Widget', 'bajaux/mixin/subscriberMixIn', 'nmodule/COREx/rc/d3/d3.min'], function (Widget, subscriberMixIn, d3) {
	"use strict";

	////////////////////////////////////////////////////////////////
	// Define Widget Constructor & Add Exposed Properties
	////////////////////////////////////////////////////////////////
	let cxGaugeCounter = 0;
	const arePrimitiveValsInObjsSame = (obj1, obj2) => !Object.keys(obj1).some(key => (obj1[key] === null || (typeof obj1[key] !== 'object' && typeof obj1[key] !== 'function')) && obj1[key] !== obj2[key])
	const needToRedrawWidget = (widget, newData) => !arePrimitiveValsInObjsSame(widget.data, newData);

	var CxGauge = function () {
		var that = this;
		Widget.apply(this, arguments);

		that.properties().addAll([
			{
				name: 'gaugeTitle1',
				value: 'Gauge Title1'
			},
			{
				name: 'gaugeTitle2',
				value: 'Gauge Title2'
			},
			{
				name: 'efficiencyGauge',
				value: true
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
			// if efficiencyGauge is true, will utilize efficiencyColorScale for arc fill (all 3 gaugeArcColors), else only nominalGaugeArcColor
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
		]);

		subscriberMixIn(that);
	};

	CxGauge.prototype = Object.create(Widget.prototype);
	CxGauge.prototype.constructor = CxGauge;


	////////////////////////////////////////////////////////////////
	// /* SETUP DEFINITIONS */
	////////////////////////////////////////////////////////////////

	const props = [
		'gaugeTitle1', 'gaugeTitle2', 'efficiencyGauge', 'title1SpacingFromMiddle', 'title2SpacingFromMiddle',
		'valueSpacingFromMiddle', 'baselineEfficiencyThreshold',
		'targetEfficiencyThreshold', 'minVal', 'maxVal',
		'gaugeArcThickness', 'titleFont',
		'unitsFont', 'valueFont', 'backgroundColor',
		'nominalGaugeArcColor', 'subTargetGaugeArcColor', 'subBaselineGaugeArcColor', 'titleColor',
		'unitsColor', 'valueColor', 'backgroundArcColor'
	];


	const setupDefinitions = widget => {
		let cx, cy, width, height, startAngle, endAngle, gaugeArcOuterRadius,
			gaugeArcInnerRadius, minValForArc, maxValForArc, valForGaugeArc, minVal, maxVal,
			efficiencyColorScale, angleScale, gaugeArcGenerator, backgroundArcGenerator,
			unitsArcGenerator, arcTween;

		const data = {};

		// FROM USER // 
		props.forEach(prop => { data[prop] = widget.properties().getValue(prop); });

		const jq = widget.jq();
		const jqWidth = jq.width() || 200;
		const jqHeight = jq.height() || 200;
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
		let widgetValue = widget.value();
		data.units = '';
		data.precision = 2;
		data.value = 0;

		if (widgetValue) {
			// Handle any Component that has an 'out' Property.
			if (widgetValue.getType().isComponent() && widgetValue.has('out')) {
				data.value = widgetValue.get('out').get('value');
			}

			// Parse out the necessary facets.
			if (widgetValue.getType().isComponent() && widgetValue.has('facets')) {
				let facets = widgetValue.get('facets');
				data.units = facets.get('units', '');
				data.precision = facets.get('precision', 2);
			}
		}

		// implements value limit for gauge arc display so that never completely empty
		valForGaugeArc = data.value;
		minValForArc = data.minVal + ((data.maxVal - data.minVal) * (data.efficiencyGauge ? 0.95 : 0.05));
		maxValForArc = data.maxVal - ((data.maxVal - data.minVal) * (data.efficiencyGauge ? 0.97 : 0.03));
		if (data.efficiencyGauge) {
			if (data.value > minValForArc) {
				valForGaugeArc = minValForArc;
			}
			if (data.value < maxValForArc) {
				valForGaugeArc = maxValForArc;
			}
		} else {
			if (data.value < minValForArc) {
				valForGaugeArc = minValForArc;
			}
			if (data.value > maxValForArc) {
				valForGaugeArc = maxValForArc;
			}
		}

		// to provide start point for next transition to use
		widget.valToStartArcTransition = valForGaugeArc;

		// if efficiencyGauge marked true, inverts min and max vals
		[minVal, maxVal] = data.efficiencyGauge ? [data.maxVal, data.minVal] : [data.minVal, data.maxVal];

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
	// Render Widget (invoke setupDefinitions() and append D3 elements into SVG)
	////////////////////////////////////////////////////////////////

	function render(widget) {

		function renderWidget(widget, data) {
			let {
				cx, cy, width, height, startAngle, endAngle, gaugeArcOuterRadius, gaugeTitle1, gaugeTitle2, efficiencyGauge,
				gaugeArcInnerRadius, minValForArc, maxValForArc, valForGaugeArc, minVal, maxVal, baselineEfficiencyThreshold,
				efficiencyColorScale, angleScale, gaugeArcGenerator, backgroundArcGenerator, targetEfficiencyThreshold,
				unitsArcGenerator, arcTween, valueSpacingFromMiddle, title1SpacingFromMiddle, title2SpacingFromMiddle,
				gaugeArcThickness, titleFont, unitsFont, valueFont, backgroundColor, nominalGaugeArcColor, subTargetGaugeArcColor,
				subBaselineGaugeArcColor, titleColor, unitsColor, valueColor, backgroundArcColor
			} = data;

			data.lastValue = data.lastValue || data.lastValue === 0 ? data.lastValue : minValForArc;

			const svg = widget.svg
				.attr('width', data.svgWidth)
				.attr('height', data.svgHeight);

			d3.select(svg.node().parentNode).style('background-color', backgroundColor)


			// delete leftover elements from versions previously rendered
			if (!svg.empty()) svg.selectAll("*").remove();

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
				// fill nominal color for non-efficiency gauge or 3 color scale for efficiency gauge. Starts with min val color prior to transition
				.attr('fill', efficiencyGauge ? efficiencyColorScale(data.lastValue) : nominalGaugeArcColor)
				.attr('d', gaugeArcGenerator(angleScale(data.lastValue)))
				.transition()
				.duration(1000)
				// if efficiency graph, transition from min val scale color to actual val's scale color
				.attr('fill', efficiencyGauge ? efficiencyColorScale(data.value) : nominalGaugeArcColor)
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
		}

		const theData = setupDefinitions(widget);
		if (!widget.data || needToRedrawWidget(widget, theData)) {
			renderWidget(widget, theData);
		}
		widget.data = theData;

	}


	////////////////////////////////////////////////////////////////
	// Initialize Widget
	////////////////////////////////////////////////////////////////

	CxGauge.prototype.doInitialize = function (element) {
		var that = this;

		element.addClass("CxGaugeOuter");

		const outerEl = d3.select(element[0])
			.style('overflow', 'hidden')

		that.svg = outerEl.append('svg')
			.attr('class', 'CxGauge')
			.attr('top', 0)
			.attr('left', 0)
			.style('overflow', 'hidden')

		that.uniqueId = 'CxGauge_' + cxGaugeCounter;
		cxGaugeCounter++;

		that.getSubscriber().attach("changed", function (prop, cx) { render(that); });

		render(that);
	};


	////////////////////////////////////////////////////////////////
	// Extra Widget Methods
	////////////////////////////////////////////////////////////////

	CxGauge.prototype.doLayout = CxGauge.prototype.doChanged = CxGauge.prototype.doLoad = function () { render(this); };

	/* FOR FUTURE NOTE: 
	CxGauge.prototype.doChanged = function (name, value) {
		if(name === "value") valueChanged += 'prototypeMethod - ';
		render(this);
	};
	*/

	CxGauge.prototype.doDestroy = function () { this.jq().removeClass("CxGaugeOuter"); };

	return CxGauge;
});

