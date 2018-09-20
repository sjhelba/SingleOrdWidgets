define(['bajaux/Widget', 'bajaux/mixin/subscriberMixIn', 'nmodule/COREx/rc/d3/d3.min', 'nmodule/COREx/rc/jsClasses/JsUtils', 'baja!'], function (Widget, subscriberMixIn, d3, JsUtils, baja) {
	'use strict';

	////////// Hard Coded Defs //////////
	const arePrimitiveValsInObjsSame = (obj1, obj2) => !Object.keys(obj1).some(key => (obj1[key] === null || (typeof obj1[key] !== 'object' && typeof obj1[key] !== 'function')) && obj1[key] !== obj2[key])
	const needToRedrawWidget = (widget, newData) => {
		const lastData = widget.data;
		// check primitives for equivalence
		if (!arePrimitiveValsInObjsSame(lastData, newData)) return true;
		//return false if nothing prompted true
		return false;
	};
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
			}
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
		data.jqHeight = jq.height() || 100;
		data.jqWidth = jq.width() || 210;
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// GET DATA
		const value = widget.value()

		if (value) {
			//get displayName
			data.displayName = value.getNavDisplayName()
			if (data.displayName === 'Cos Timer') data.displayName = 'Change Of State';

			//get enabled
			data.timerRunning = data.displayName === 'Change Of State' ? value.getDone() : value.getEnabled().getValue();

			//get preset
			data.preset = value.getPreset()
			data.presetHours = data.preset.getHours();
			data.presetMinutes = data.preset.getMinutesPart();
			data.presetSeconds = data.preset.getSecondsPart();

			//function for changing preset
			data.changePreset = ({hours, minutes, seconds}) => {
				const timeObj = {};
				timeObj.hours = hours || +hours === 0 ? +hours : data.presetHours;
				timeObj.minutes = minutes || +minutes === 0 ? +minutes : data.presetMinutes;
				timeObj.seconds = seconds || +seconds === 0 ? +seconds : data.presetSeconds;

				return value.set({slot: 'preset', value: baja.RelTime.make(timeObj)})
				.then(() => render(widget, true))
				.catch(err => console.error('error changing timer preset: ' + err))
			}

			//function for resetting timer
			data.resetTimer = () => {
				return value.resetTimer()
				.then(() =>	render(widget, true))
				.catch(err => console.error('error resetting timer: ' + err))
			}

			//function for bypassing timer
			data.bypassTimer = () => {
				return value.bypassTimer()
				.then(() =>	render(widget, true))
				.catch(err => console.error('error bypassing timer: ' + err))
			}

			return data;
		}

		return false;
	};




	////////////////////////////////////////////////////////////////
		// Render Widget (invoke setupDefinitions() and, using returned data, append D3 elements into SVG)
	////////////////////////////////////////////////////////////////

	const renderWidget = (widget, data) => {
		// ********************************************* DEFINE ******************************************************* //
		const buttonFont = 'bold 10.0pt Nirmala UI';
		const titleFont = 'bold 12.0pt Nirmala UI'
		const buttonTextHeight = JsUtils.getTextHeight(buttonFont);
		const titleTextHeight = JsUtils.getTextHeight(titleFont);
		const verticalBoxPadding = 3;
		const horizontalBoxPadding = 12;
		const buttonHeight = buttonTextHeight + (verticalBoxPadding * 3)
		const rowHeight = d3.max([buttonHeight, titleTextHeight]);
		const spaceBetweenRows = 10;
		const hoursDisplay = '0'.repeat(5 - data.presetHours.toString().length) + data.presetHours.toString();
		const minutesDisplay = data.presetMinutes.toString().length === 1 ? '0' + data.presetMinutes.toString() : data.presetMinutes;
		const secondsDisplay = data.presetSeconds.toString().length === 1 ? '0' + data.presetSeconds.toString() : data.presetSeconds;
		const hoursWidth = JsUtils.getTextWidth('88888', buttonFont);
		const hoursBoxWidth = hoursWidth + (horizontalBoxPadding * 2);
		const timeLabelWidth = JsUtils.getTextWidth('m', buttonFont);
		const spaceAfterBox = 3;
		const spaceAfterTimeLabel = 10;
		const minuteAndSecondWidth = JsUtils.getTextWidth('88', buttonFont);
		const minuteAndSecondBoxWidth = minuteAndSecondWidth + (horizontalBoxPadding * 2);
		const resetAndBypassButtonWidth = JsUtils.getTextWidth('Bypass', buttonFont) + (horizontalBoxPadding * 2);
		const resetBoxPadding = (resetAndBypassButtonWidth - JsUtils.getTextWidth('Reset', buttonFont)) / 2
		const rectStrokeColor = 'silver';
		const rectHoverStrokeColor = 'gray'
		const rectClickColor = 'gray'
		const textColor = '#404040'
		const grayedOutColor = 'silver'
		const resetStroke = '#22b573'
		const bypassStroke = '#Ecb550'
		const boxWeight = 2;


		// ********************************************* DRAW ******************************************************* //
		d3.select(widget.svg.node().parentNode).style('background-color', data.backgroundColor);
		// delete leftover elements from versions previously rendered
		if (!widget.svg.empty()) JsUtils.resetElements(widget.svg, '*');
		const graphicGroup = widget.svg.append('g')
			.attr('class', 'graphicGroup')
			.attr('transform', `translate(${margin}, ${margin})`)
			.attr('stroke-width', boxWeight)
			.style('cursor', 'default')


		const rows = graphicGroup.selectAll('.row')
			.data(['row1', 'row2', 'row3', 'row4'])
			.enter().append('g')
				.attr('class', d => `row ${d}`)
				.attr('transform', (d, i) => `translate(0, ${titleTextHeight + (i ? ((i-1) * rowHeight) + (i * spaceBetweenRows) : 0)})`)

		// ********************************************* ROW 1 ******************************************************* //
		graphicGroup.select('.row1').append('text')
			.style('font', titleFont)
			.text(data.displayName)

		// ********************************************* ROW 2 ******************************************************* //
		const row2 = graphicGroup.select('.row2').style('font', buttonFont)

			//hours
		const hoursGroup = row2.append('g').attr('class', 'hoursGroup')
			.on('mouseover', () => hoursRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => hoursRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => hoursRect.attr('fill', rectClickColor))
			.on('mouseup', () => hoursRect.attr('fill', data.backgroundColor))
			.on('click', function() {
				const hoursPrompt = prompt('Set Preset Hours', hoursDisplay)
				if (hoursPrompt == null || hoursPrompt == "" || hoursPrompt == hoursDisplay) {
				} else if (hoursPrompt.length > 5 || isNaN(hoursPrompt)) {
					alert('Timer preset hours must be a number with a max of 5 digits')
				} else {
					data.changePreset({hours: hoursPrompt})
				}
			})
		const hoursRect = hoursGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', hoursBoxWidth)
			.attr('stroke', rectStrokeColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const hoursValue = hoursGroup.append('text')
			.text(hoursDisplay)
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', horizontalBoxPadding);
		const hoursLabel = hoursGroup.append('text')
			.text('h')
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', hoursBoxWidth + spaceAfterBox)

			//minutes
		const minutesGroup = row2.append('g').attr('class', 'minutesGroup')
			.attr('transform', `translate(${hoursBoxWidth + spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel}, 0)`)
			.on('mouseover', () => minutesRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => minutesRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => minutesRect.attr('fill', rectClickColor))
			.on('mouseup', () => minutesRect.attr('fill', data.backgroundColor))
			.on('click', function() {
				const minutesPrompt = prompt('Set Preset Minutes', minutesDisplay)
				if (minutesPrompt == null || minutesPrompt == "" || minutesPrompt == minutesDisplay) {
				} else if (isNaN(minutesPrompt) || +minutesPrompt >= 60) {
					alert('Timer preset minutes must be a number less than 60')
				} else {
					data.changePreset({minutes: minutesPrompt})
				}
			})
		const minutesRect = minutesGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', minuteAndSecondBoxWidth)
			.attr('stroke', rectStrokeColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const minutesValue = minutesGroup.append('text')
			.text(minutesDisplay)
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', horizontalBoxPadding);
		const minutesLabel = minutesGroup.append('text')
			.text('m')
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', minuteAndSecondBoxWidth + spaceAfterBox)
			
			//seconds
		const secondsGroup = row2.append('g').attr('class', 'secondsGroup')
			.attr('transform', `translate(${hoursBoxWidth + minuteAndSecondBoxWidth + (2 *(spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel))}, 0)`)
			.on('mouseover', () => secondsRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => secondsRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => secondsRect.attr('fill', rectClickColor))
			.on('mouseup', () => secondsRect.attr('fill', data.backgroundColor))
			.on('click', function() {
				const secondsPrompt = prompt('Set Preset Seconds', secondsDisplay)
				if (secondsPrompt == null || secondsPrompt == "" || secondsPrompt == secondsDisplay) {
				} else if (isNaN(secondsPrompt) || +secondsPrompt >= 60) {
					alert('Timer preset seconds must be a number less than 60')
				} else {
					data.changePreset({seconds: secondsPrompt})
				}
			})
		const secondsRect = secondsGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', minuteAndSecondBoxWidth)
			.attr('stroke', rectStrokeColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const secondsValue = secondsGroup.append('text')
			.text(secondsDisplay)
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', horizontalBoxPadding);
		const secondsLabel = secondsGroup.append('text')
			.text('s')
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', minuteAndSecondBoxWidth + spaceAfterBox)

		// ********************************************* ROW 3 ******************************************************* //
		const row3 = graphicGroup.select('.row3').style('font', buttonFont)

		//reset
		const resetGroup = row3.append('g').attr('class', 'resetGroup')
			.on('mouseover', () => {if (data.timerRunning) resetHoverBar.transition().duration(300).attr('width', resetAndBypassButtonWidth).attr('x', 0)})
			.on('mouseout', () => {if (data.timerRunning) resetHoverBar.transition().duration(300).attr('width', 0).attr('x', resetAndBypassButtonWidth / 2)})
			.on('mousedown', () => data.timerRunning ? resetRect.attr('fill', resetStroke) : null)
			.on('mouseup', () => resetRect.attr('fill', data.backgroundColor))
			.on('click', function() {if (data.timerRunning && confirm('Are you sure you\'d like to reset ' + data.displayName + '?')) data.resetTimer()})
		const resetRect = resetGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', resetAndBypassButtonWidth)
			.attr('stroke', data.timerRunning ? resetStroke : grayedOutColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const resetValue = resetGroup.append('text')
			.text('Reset')
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', resetBoxPadding)
			.attr('fill', data.timerRunning ? textColor : grayedOutColor);

			//bypass
		const bypassGroup = row3.append('g').attr('class', 'bypassGroup')
			.attr('transform', `translate(${hoursBoxWidth + spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel}, 0)`)
			.on('mouseover', () => {if (data.timerRunning) bypassHoverBar.transition().duration(300).attr('width', resetAndBypassButtonWidth).attr('x', (hoursBoxWidth + spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel))})
			.on('mouseout', () => {if (data.timerRunning) bypassHoverBar.transition().duration(300).attr('width', 0).attr('x', (hoursBoxWidth + spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel) + (resetAndBypassButtonWidth / 2))})
			.on('mousedown', () => data.timerRunning ? bypassRect.attr('fill', bypassStroke) : null)
			.on('mouseup', () => bypassRect.attr('fill', data.backgroundColor))
			.on('click', function() {if (data.timerRunning && confirm('Are you sure you\'d like to bypass ' + data.displayName + '?')) data.bypassTimer()})
		const bypassRect = bypassGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', resetAndBypassButtonWidth)
			.attr('stroke', data.timerRunning ? bypassStroke : grayedOutColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const bypassValue = bypassGroup.append('text')
			.text('Bypass')
			.attr('y', buttonTextHeight + verticalBoxPadding)
			.attr('x', horizontalBoxPadding)
			.attr('fill', data.timerRunning ? textColor : grayedOutColor);
		
		// ********************************************* ROW 4 ******************************************************* //
		const row4 = graphicGroup.select('.row4').attr('transform', `translate(0, ${titleTextHeight + (spaceBetweenRows * 2.25) + (buttonHeight * 2)})`)

		const resetHoverBar = row4.append('rect')
			.attr('height', boxWeight)
			.attr('fill', resetStroke)
			.attr('width', 0)
			.attr('x', resetAndBypassButtonWidth / 2)

		const bypassHoverBar = row4.append('rect')
			.attr('height', boxWeight)
			.attr('fill', bypassStroke)
			.attr('width', 0)
			.attr('x', (hoursBoxWidth + spaceAfterBox + timeLabelWidth + spaceAfterTimeLabel) + (resetAndBypassButtonWidth / 2))







	};


	function render(widget, force) {
		// invoking setupDefinitions, then returning value from successful promise to renderWidget func
		const data = setupDefinitions(widget);
		if (data) {
			if ( force || !widget.data || needToRedrawWidget(widget, data) ) renderWidget(widget, data);
			widget.data = data;
		} else {
			console.log('No timer data currently bound to widget')
		}
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

