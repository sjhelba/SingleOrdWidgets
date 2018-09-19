define(['bajaux/Widget', 'bajaux/mixin/subscriberMixIn', 'nmodule/COREx/rc/d3/d3.min', 'nmodule/COREx/rc/jsClasses/JsUtils', 'baja!'], function (Widget, subscriberMixIn, d3, JsUtils, baja) {
	'use strict';

////////// Hard Coded Defs //////////
// const arePrimitiveValsInObjsSame = (obj1, obj2) => !Object.keys(obj1).some(key => (obj1[key] === null || (typeof obj1[key] !== 'object' && typeof obj1[key] !== 'function')) && obj1[key] !== obj2[key])
// // 0 layers means obj only has primitive values
// // this func only works with obj literals or arrays layered with obj literals or arrays until base layer only primitive
// const checkNestedObjectsEquivalence = (objA, objB, layers) => {
// 	if (layers === 0) {
// 		return arePrimitiveValsInObjsSame(objA, objB);
// 	} else {
// 		const objAKeys = Object.keys(objA);
// 		const objBKeys = Object.keys(objB);
// 		if (objAKeys.length !== objBKeys.length) return false;
// 		const somethingIsNotEquivalent = objAKeys.some(key => !checkNestedObjectsEquivalence(objA[key], objB[key], layers - 1));
// 		return !somethingIsNotEquivalent;
// 	}
// };
// const needToRedrawWidget = (widget, newData) => {
// 	const lastData = widget.data;
// 	// check primitives for equivalence
// 	if (!arePrimitiveValsInObjsSame(lastData, newData)) return true;
// 	// check nested arrays for equivalence
// 	const monthlyModulesAreSame = checkNestedObjectsEquivalence(lastData.tableData, newData.tableData, 2);
// 	if (!monthlyModulesAreSame) return true;
// 	//return false if nothing prompted true
// 	return false;
// };
	const margin = 5;


////////////////////////////////////////////////////////////////
	// Define Widget Constructor & Exposed Properties
////////////////////////////////////////////////////////////////

	var TimerSettingsWidget = function () {
		var that = this;
		Widget.apply(this, arguments);

		that.properties().addAll([
			{
				name: 'backgroundColor',
				value: 'white',
				typeSpec: 'gx:Color'
			},
			{
				name: 'title',
				value: 'Timer'
			},
			// {
			// 	name: 'paddingUnderLegendText',
			// 	value: 5
			// },
			// {
			// 	name: 'systemName',
			// 	value: 'systemName'
			// },
			// {
			// 	name: 'tooltipFillColor',
			// 	value: '#f2f2f2',
			// 	typeSpec: 'gx:Color'
			// },
			// {
			// 	name: 'modulePercentFont',
			// 	value: 'bold 26.0pt Nirmala UI',
			// 	typeSpec: 'gx:Font'
			// }
		]);



		subscriberMixIn(that);
	};

	TimerSettingsWidget.prototype = Object.create(Widget.prototype);
	TimerSettingsWidget.prototype.constructor = TimerSettingsWidget;



////////////////////////////////////////////////////////////////
	// /* SETUP DEFINITIONS AND DATA */
////////////////////////////////////////////////////////////////


	const setupDefinitions = widget => {
		// FROM USER // 
		const data = widget.properties().toValueMap();	//obj with all exposed properties as key/value pairs

		// FROM JQ //
		const jq = widget.jq();

		//SIZING
		data.jqHeight = jq.height() || 400;
		data.jqWidth = jq.width() || 350;
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// GLOBALS PER INSTANCE
		if (!widget.activeModule) widget.activeModule = 'none';


		// GET DATA
		const value = widget.value()

		if (value) {
			data.displayName = value.getNavDisplayName()
			if (data.displayName === 'Cos Timer') data.displayName = 'Change Of State';

			data.enabled = value.getEnabled()
			data.enabledValue = data.enabled.getValue();
			// data.enabled.setValue(!data.enabledValue);

			data.preset = value.getPreset()
			data.presetHours = data.preset.getHours();
			data.presetMinutes = data.preset.getMinutesPart();
			data.presetSeconds = data.preset.getSecondsPart();

			// const newPreset = baja.RelTime.make({
			// 	hours: presetHours + 1,
			// 	minutes: presetMinutes + 1,
			// 	seconds: presetSeconds + 1
			// });
			// return value.set({
			// 	slot: 'preset',
			// 	value: newPreset
			// })
			// .then(() => data)

		}

		return Promise.resolve(data);
	};




////////////////////////////////////////////////////////////////
	// Render Widget (invoke setupDefinitions() and, using returned data, append D3 elements into SVG)
////////////////////////////////////////////////////////////////

	const renderWidget = (widget, data) => {
		// ********************************************* DEFINE ******************************************************* //
		const buttonFont = '10.0pt Nirmala UI';
		const titleFont = 'bold 12.0pt Nirmala UI'
		const buttonTextHeight = JsUtils.getTextHeight(buttonFont);
		const titleTextHeight = JsUtils.getTextHeight(titleFont);
		const boxPadding = 5
		const buttonHeight = buttonTextHeight + (boxPadding * 2)
		const rowHeight = d3.max([buttonHeight, titleTextHeight]);
		const spaceBetweenRows = 5;
		const hoursDisplay = '0'.repeat(5 - data.presetHours.toString().length) + data.presetHours.toString();
		const minutesDisplay = data.presetMinutes.toString().length === 1 ? '0' + data.presetMinutes.toString() : data.presetMinutes;
		const secondsDisplay = data.presetSeconds.toString().length === 1 ? '0' + data.presetSeconds.toString() : data.presetSeconds;
		const hoursWidth = JsUtils.getTextWidth('88888', buttonFont);
		const hoursBoxWidth = hoursWidth + (boxPadding * 2);
		const timeLabelWidth = JsUtils.getTextWidth('m', buttonFont);
		const spaceAfterBox = 5;
		const spaceAfterTimeLabel = 10;
		const minuteAndSecondWidth = JsUtils.getTextWidth('88', buttonFont);
		const minuteAndSecondBoxWidth = minuteAndSecondBoxWidth + (boxPadding * 2);
		const resetAndBypassButtonWidth = JsUtils.getTextWidth('Bypass', buttonFont) + (boxPadding * 2);
		const rectStrokeColor = 'gray';
		const rectHoverStrokeColor = 'lightgray'
		const rectClickColor = 'powderblue'
		const textColor = 'black'
		const grayedOutTextColor = 'gray'


		// ********************************************* DRAW ******************************************************* //
    d3.select(widget.svg.node().parentNode).style('background-color', data.backgroundColor);
		// delete leftover elements from versions previously rendered
		if (!widget.svg.empty()) JsUtils.resetElements(widget.svg, '*');
		const graphicGroup = widget.svg.append('g')
			.attr('class', 'graphicGroup')
			.attr('transform', `translate(${margin}, ${margin})`)


		const rows = graphicGroup.selectAll('.row')
			.data(['row1', 'row2', 'row3'])
			.enter().append('g')
				.attr('class', d => `row ${d}`)
				.attr('transform', (d, i) => `translate(0, ${((i + 1) * rowHeight) + (i * spaceBetweenRows)})`)

		//row 1
		graphicGroup.select('.row1').append('text')
			.style('font', titleFont)
			.text(data.displayName)

		//row 2
		const row2 = graphicGroup.select('.row2').style('font', buttonFont)

			//hours
		const hoursGroup = row2.append('g').attr('class', 'hoursGroup')
			.on('mouseover', () => hoursRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => hoursRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => hoursRect.attr('fill', rectClickColor))
			.on('mouseup', () => hoursRect.attr('fill', data.backgroundColor))
		const hoursRect = hoursGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', hoursBoxWidth)
			.attr('stroke', rectStrokeColor)
			.attr('fill', data.backgroundColor)
		const hoursValue = hoursGroup.append('text')
			.text(data.hoursDisplay)
			.attr('y', boxPadding);
		const hoursLabel = hoursGroup.append('text')
			.text('h')
			.attr('y', hoursBoxWidth + spaceAfterBox)

			//minutes
		const minutesGroup = row2.append('g').attr('class', 'minutesGroup')
			.on('mouseover', () => minutesRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => minutesRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => minutesRect.attr('fill', rectClickColor))
			.on('mouseup', () => minutesRect.attr('fill', data.backgroundColor))
			.attr('transform', `translate(${hoursBoxWidth + spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel}, 0)`)
		const minutesRect = row2.append('rect')
			.attr('height', buttonHeight)
			.attr('width', minuteAndSecondBoxWidth)
			.attr('stroke', rectStrokeColor)
			.attr('fill', data.backgroundColor)
		const minutesValue = row2.append('text')
			.text(data.minutesDisplay)
			.attr('y', boxPadding);
		const minutesLabel = row2.append('text')
			.text('m')
			.attr('y', minuteAndSecondBoxWidth + spaceAfterBox)
			
		//seconds
		const secondsGroup = row2.append('g').attr('class', 'secondsGroup')
			.on('mouseover', () => secondsRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => secondsRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => secondsRect.attr('fill', rectClickColor))
			.on('mouseup', () => secondsRect.attr('fill', data.backgroundColor))
			.attr('transform', `translate(${hoursBoxWidth + minuteAndSecondBoxWidth + (2 *(spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel))}, 0)`)
		const secondsRect = row2.append('rect')
			.attr('height', buttonHeight)
			.attr('width', minuteAndSecondBoxWidth)
			.attr('stroke', rectStrokeColor)
			.attr('fill', data.backgroundColor)
		const secondsValue = row2.append('text')
			.text(data.secondsDisplay)
			.attr('y', boxPadding);
		const secondsLabel = row2.append('text')
			.text('m')
			.attr('y', minuteAndSecondBoxWidth + spaceAfterBox)






	};


	function render(widget, force) {
		// invoking setupDefinitions, then returning value from successful promise to renderWidget func
		return setupDefinitions(widget)
			.then(data => {
				// if (force || !widget.data || needToRedrawWidget(widget, data)){
					renderWidget(widget, data);	
				// }
				widget.data = data;
			})
	}


////////////////////////////////////////////////////////////////
	// Initialize Widget
////////////////////////////////////////////////////////////////

	TimerSettingsWidget.prototype.doInitialize = function (element) {
		var that = this;
		element.addClass('TimerSettingsWidgetOuter');
		const outerEl = d3.select(element[0])
			.style('overflow', 'hidden')

		that.svg = outerEl.append('svg')
			.attr('class', 'TimerSettingsWidget')
			.style('overflow', 'hidden')

		that.getSubscriber().attach('changed', function (prop, cx) { render(that) });
		that.interval = setInterval(() => render(that), 8000)
	};


////////////////////////////////////////////////////////////////
	// Extra Widget Methods
////////////////////////////////////////////////////////////////

	TimerSettingsWidget.prototype.doLayout = TimerSettingsWidget.prototype.doChanged = TimerSettingsWidget.prototype.doLoad = function () { render(this); };

	/* FOR FUTURE NOTE: 
	TimerSettingsWidget.prototype.doChanged = function (name, value) {
		  if(name === 'value') valueChanged += 'prototypeMethod - ';
		  render(this);
	};
	*/

	TimerSettingsWidget.prototype.doDestroy = function () {
		this.jq().removeClass('TimerSettingsWidgetOuter');
		clearInterval(this.interval);
	};

	return TimerSettingsWidget;
});

