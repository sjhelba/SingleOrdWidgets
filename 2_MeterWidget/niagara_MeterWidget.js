define(['bajaux/Widget', 'bajaux/mixin/subscriberMixIn', 'nmodule/COREx/rc/d3/d3.min', 'nmodule/COREx/rc/jsClasses/JsUtils', 'nmodule/COREx/rc/jsClasses/Meter'], function (Widget, subscriberMixIn, d3, JsUtils, Meter) {
	'use strict';


	////////// Hard Coded Defs //////////
	const arePrimitiveValsInObjsSame = (obj1, obj2) => !Object.keys(obj1).filter(key => key !== 'meterValue' && key !== 'precision' && key !== 'units').some(key => (obj1[key] === null || (typeof obj1[key] !== 'object' && typeof obj1[key] !== 'function')) && obj1[key] !== obj2[key])
	// 0 layers means obj only has primitive values
	// this func only works with obj literals or arrays layered with obj literals or arrays until base layer only primitive
	const needToRedrawWidget = (widget, newData) => {
		const lastData = widget.data;

		// check primitives for equivalence
		if (!arePrimitiveValsInObjsSame(lastData, newData)) return true;	//filtered so not redrawing based on metervalue data


		//return false if nothing prompted true
		return false;
	};
	const margin = 2;


////////////////////////////////////////////////////////////////
	// Define Widget Constructor & Exposed Properties
////////////////////////////////////////////////////////////////

	var MeterWidget = function () {
		var that = this;
		Widget.apply(this, arguments);

		that.properties().addAll([
			/* COLORS */
			{
				name: 'backgroundColor',
				value: 'white',
				typeSpec: 'gx:Color'
			},
			{
				name: 'meterFillColor',
				value: 'rgb(252,181,80)',
				typeSpec: 'gx:Color'
			},
		/* OTHER */
			{
				name: 'meterLabel',
				value: ''
			},
			{
				name: 'minValue',
				value: 0
			},
			{
				name: 'maxValue',
				value: 100
			},
			{
				name: 'showDesignTick',
				value: true
			},
			{
				name: 'designValue',
				value: 50
			}
		]);



		subscriberMixIn(that);
	};

	MeterWidget.prototype = Object.create(Widget.prototype);
	MeterWidget.prototype.constructor = MeterWidget;



////////////////////////////////////////////////////////////////
	// /* SETUP DEFINITIONS AND DATA */
////////////////////////////////////////////////////////////////


	const setupDefinitions = widget => {
		// FROM USER // 
		const data = widget.properties().toValueMap();	//obj with all exposed properties as key/value pairs

		// FROM JQ //
		const jq = widget.jq();

		//SIZING
		data.jqHeight = jq.height() || 45;
		data.jqWidth = jq.width() || 160;
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// GET DATA
		const valueData = widget.value();
		data.meterValue = valueData && valueData.has('out') ? valueData.get('out').get('value') || 0 : 0;
		if (valueData && valueData.has('facets')) {
			const facets = valueData.get('facets');
			data.units = facets.get('units') ? facets.get('units').getSymbol() : '';
			data.precision = facets.get('precision') ? facets.get('precision').valueOf() : 0;
		} else {
			data.units = '';
			data.precision = 0;
		}


		// GLOBALS PER INSTANCE //
		// if (!widget.isCurrentlyHovered) widget.isCurrentlyHovered = false;



		return data;

	};




////////////////////////////////////////////////////////////////
	// Render Widget (invoke setupDefinitions() and, using returned data, append D3 elements into SVG)
////////////////////////////////////////////////////////////////

	const renderWidget = (widget, data) => {
		// ********************************************* SIZING ETC ******************************************************* //
		const meterTitleFont = '10.0pt Nirmala UI';
		const meterUnitsFont = 'bold 10.0pt Nirmala UI';
		const meterNumFont = 'bold 10.0pt Nirmala UI';
		const meterHeight = 12;
		const meterObjHeight = Meter.getHeightFromMeterHeight(meterHeight, meterTitleFont, meterUnitsFont, meterNumFont);	//36.3


		// ********************************************* DRAW ******************************************************* //

		widget.svg 
			.attr('height', data.jqHeight + 'px')
			.attr('width', data.jqWidth + 'px')
			
		d3.select(widget.svg.node().parentNode).style('background-color', data.backgroundColor);
		
		// delete leftover elements from versions previously rendered
		if (!widget.svg.empty()) JsUtils.resetElements(widget.svg, '*');

		// ********************************************* GRAPHIC GROUP ******************************************************* //

	

		const graphicGroup = widget.svg.append('g').attr('class', 'graphicGroup').attr('transform', `translate(${margin}, ${margin})`);
		
		// ********************************************* OUTER ELLIPSE ******************************************************* //
		const meterGroup = graphicGroup.append('g')
			.attr('class', 'meterGroup')
			.attr('transform', `translate(${0}, ${0})`);
		// const tooltipGroup = graphicGroup.append('g')
		// 	.attr('class', 'tooltipGroup')
		// 	.attr('transform', `translate(${0}, ${meterObjHeight + 10})`);



		widget.meter = new Meter(meterGroup,
			meterGroup,	//	tooltipGroup,
			data.backgroundColor,
			data.meterFillColor,
			'black',
			meterObjHeight,
			data.graphicWidth,
			data.meterLabel,
			data.units,
			data.precision,
			meterTitleFont,
			meterUnitsFont,
			meterNumFont,
			data.meterValue,
			data.minValue,
			data.maxValue,
			false,	//has tooltip
			data.showDesignTick ? data.designValue : null,
			false // widget.isCurrentlyHovered
			);

			const meterElement = widget.meter.create();
			// const thisTooltip = meter.tooltip;
			// meterElement
			// 	.on('mouseover', () => {
			// 		widget.isCurrentlyHovered = true;
			// 		thisTooltip.show()
			// 	})
			// 	.on('mouseout', () => {
			// 		widget.isCurrentlyHovered = false;
			// 		thisTooltip.hide()
			// 	});
			// if (widget.isCurrentlyHovered) thisTooltip.show();





	};


	function render(widget, force) {
		// invoking setupDefinitions, then returning value from successful promise to renderWidget func
		const data = setupDefinitions(widget)
		//if value data has changed, change value data
		if (widget.data) {
			const newArgsObj = {};
			let valueChanged = false;
			if (widget.meterValue !== data.meterValue) {
				newArgsObj.meterVal = data.meterValue;
				widget.meterValue = data.meterValue
				valueChanged = true;
			}
			if (widget.precision !== data.precision) {
				newArgsObj.precision = data.precision;
				widget.precision = data.precision
				valueChanged = true;
			}
			if (widget.units !== data.units) {
				newArgsObj.units = data.units;
				widget.units = data.units
				valueChanged = true;
			}
			if (valueChanged) widget.meter.redrawWithNewArgs(newArgsObj);
		}

		if (force || !widget.data || needToRedrawWidget(widget, data)) renderWidget(widget, data);

		widget.data = data;
			
	}


////////////////////////////////////////////////////////////////
	// Initialize Widget
////////////////////////////////////////////////////////////////

	MeterWidget.prototype.doInitialize = function (element) {
		var that = this;
		element.addClass('MeterWidgetOuter');
		const outerEl = d3.select(element[0])
			.style('overflow', 'hidden')

		that.svg = outerEl.append('svg')
			.attr('class', 'MeterWidget')
			.style('overflow', 'hidden')
			.attr('top', 0)
			.attr('left', 0)
			.attr('width', '100%')
			.attr('height', '100%');

		that.getSubscriber().attach('changed', function (prop, cx) { render(that) });
	};


////////////////////////////////////////////////////////////////
	// Extra Widget Methods
////////////////////////////////////////////////////////////////

	MeterWidget.prototype.doLayout = MeterWidget.prototype.doChanged = MeterWidget.prototype.doLoad = function () { render(this); };

	/* FOR FUTURE NOTE: 
	MeterWidget.prototype.doChanged = function (name, value) {
		  if(name === 'value') valueChanged += 'prototypeMethod - ';
		  render(this);
	};
	*/

	MeterWidget.prototype.doDestroy = function () {
		this.jq().removeClass('MeterWidgetOuter');
	};

	return MeterWidget;
});

