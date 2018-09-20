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

	var PointValueChanger = function () {
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

	PointValueChanger.prototype = Object.create(Widget.prototype);
	PointValueChanger.prototype.constructor = PointValueChanger;



	////////////////////////////////////////////////////////////////
		// /* SETUP DEFINITIONS AND DATA */
	////////////////////////////////////////////////////////////////


	const setupDefinitions = widget => {
		// FROM USER // 
		const data = widget.properties().toValueMap();	//obj with all exposed properties as key/value pairs

		// FROM JQ //
		const jq = widget.jq();

		//SIZING
		data.jqHeight = jq.height() || 110;
		data.jqWidth = jq.width() || 180;
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
				.then(() => {
					render(widget, true)
				})
				.catch(err => console.error('error changing timer preset: ' + err))
			}

			//function for resetting timer
			data.resetTimer = () => {
				console.log('value', value)
				return value.resetTimer()
				.then(() =>	{
					console.log('successful reset')
					return render(widget, true)
				})
				.catch(err => console.error('error resetting timer: ' + err))
			}

			//function for bypassing timer
			data.bypassTimer = () => {
				return value.bypassTimer()
				.then(() =>	{
					console.log('successful bypass')
					return render(widget, true)
				})				.catch(err => console.error('error bypassing timer: ' + err))
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
		const buttonFont = 'bold 12.0pt Nirmala UI';
		const titleFont = 'bold 14.0pt Nirmala UI'
		const buttonTextHeight = JsUtils.getTextHeight(buttonFont);
		const titleTextHeight = JsUtils.getTextHeight(titleFont);
		const boxPadding = 4
		const buttonHeight = buttonTextHeight + (boxPadding * 3)
		const rowHeight = d3.max([buttonHeight, titleTextHeight]);
		const spaceBetweenRows = 10;
		const hoursDisplay = '0'.repeat(5 - data.presetHours.toString().length) + data.presetHours.toString();
		const minutesDisplay = data.presetMinutes.toString().length === 1 ? '0' + data.presetMinutes.toString() : data.presetMinutes;
		const secondsDisplay = data.presetSeconds.toString().length === 1 ? '0' + data.presetSeconds.toString() : data.presetSeconds;
		const hoursWidth = JsUtils.getTextWidth('88888', buttonFont);
		const hoursBoxWidth = hoursWidth + (boxPadding * 2);
		const timeLabelWidth = JsUtils.getTextWidth('m', buttonFont);
		const spaceAfterBox = 3;
		const spaceAfterTimeLabel = 10;
		const minuteAndSecondWidth = JsUtils.getTextWidth('88', buttonFont);
		const minuteAndSecondBoxWidth = minuteAndSecondWidth + (boxPadding * 2);
		const resetAndBypassButtonWidth = JsUtils.getTextWidth('Bypass', buttonFont) + (boxPadding * 2);
		const resetBoxPadding = (resetAndBypassButtonWidth - JsUtils.getTextWidth('Reset', buttonFont)) / 2
		const rectStrokeColor = 'gray';
		const rectHoverStrokeColor = 'lightgray'
		const rectClickColor = 'oldlace'
		const textColor = 'black'
		const grayedOutColor = 'gray'
		const resetStroke = 'green'
		const hoveredResetStroke = 'greenyellow'
		const bypassStroke = 'gold'
		const hoveredBypassStroke = 'khaki'


		// ********************************************* DRAW ******************************************************* //
		d3.select(widget.svg.node().parentNode).style('background-color', data.backgroundColor);
		// delete leftover elements from versions previously rendered
		if (!widget.svg.empty()) JsUtils.resetElements(widget.svg, '*');
		const graphicGroup = widget.svg.append('g')
			.attr('class', 'graphicGroup')
			.attr('transform', `translate(${margin}, ${margin})`)
			.attr('stroke-width', 3)
			.style('cursor', 'default')


		const rows = graphicGroup.selectAll('.row')
			.data(['row1', 'row2', 'row3'])
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
			.attr('y', buttonTextHeight + boxPadding)
			.attr('x', boxPadding);
		const hoursLabel = hoursGroup.append('text')
			.text('h')
			.attr('y', buttonTextHeight + boxPadding)
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
			.attr('y', buttonTextHeight + boxPadding)
			.attr('x', boxPadding);
		const minutesLabel = minutesGroup.append('text')
			.text('m')
			.attr('y', buttonTextHeight + boxPadding)
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
			.attr('y', buttonTextHeight + boxPadding)
			.attr('x', boxPadding);
		const secondsLabel = secondsGroup.append('text')
			.text('s')
			.attr('y', buttonTextHeight + boxPadding)
			.attr('x', minuteAndSecondBoxWidth + spaceAfterBox)

		// ********************************************* ROW 3 ******************************************************* //
		const row3 = graphicGroup.select('.row3').style('font', buttonFont)

		//reset
		const resetGroup = row3.append('g').attr('class', 'resetGroup')
			.on('mouseover', () => data.timerRunning ? resetRect.attr('stroke', hoveredResetStroke) : null)
			.on('mouseout', () => data.timerRunning ? resetRect.attr('stroke', resetStroke) : null)
			.on('mousedown', () => data.timerRunning ? resetRect.attr('fill', rectClickColor) : null)
			.on('mouseup', () => resetRect.attr('fill', data.backgroundColor))
			.on('click', function() {
				if (data.timerRunning) {
					if (confirm('Are you sure you\'d like to reset ' + data.displayName + '?')) {
						//action reset
						
					}
				}
			})
		const resetRect = resetGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', resetAndBypassButtonWidth)
			.attr('stroke', data.timerRunning ? resetStroke : grayedOutColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const resetValue = resetGroup.append('text')
			.text('Reset')
			.attr('y', buttonTextHeight + boxPadding)
			.attr('x', resetBoxPadding)
			.attr('fill', data.timerRunning ? textColor : grayedOutColor);

			//bypass
		const bypassGroup = row3.append('g').attr('class', 'bypassGroup')
			.attr('transform', `translate(${resetAndBypassButtonWidth + spaceAfterTimeLabel}, 0)`)
			.on('mouseover', () => data.timerRunning ? bypassRect.attr('stroke', hoveredBypassStroke) : null)
			.on('mouseout', () => data.timerRunning ? bypassRect.attr('stroke', bypassStroke) : null)
			.on('mousedown', () => data.timerRunning ? bypassRect.attr('fill', rectClickColor) : null)
			.on('mouseup', () => bypassRect.attr('fill', data.backgroundColor))
			.on('click', function() {
				if (data.timerRunning) {
					if (confirm('Are you sure you\'d like to bypass ' + data.displayName + '?')) {
						//action bypass
					}
				}
			})
		const bypassRect = bypassGroup.append('rect')
			.attr('height', buttonHeight)
			.attr('width', resetAndBypassButtonWidth)
			.attr('stroke', data.timerRunning ? bypassStroke : grayedOutColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const bypassValue = bypassGroup.append('text')
			.text('Bypass')
			.attr('y', buttonTextHeight + boxPadding)
			.attr('x', boxPadding)
			.attr('fill', data.timerRunning ? textColor : grayedOutColor);
		






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

	PointValueChanger.prototype.doInitialize = function (element) {
		var that = this;
		element.addClass('PointValueChangerOuter');
		const outerEl = d3.select(element[0])
			.style('overflow', 'hidden')

		that.svg = outerEl.append('svg')
			.attr('class', 'PointValueChanger')
			.style('overflow', 'hidden')

		that.getSubscriber().attach('changed', function (prop, cx) { render(that) });
		that.interval = setInterval(() => render(that), 8000)
	};


	////////////////////////////////////////////////////////////////
		// Extra Widget Methods
	////////////////////////////////////////////////////////////////

	PointValueChanger.prototype.doLayout = PointValueChanger.prototype.doChanged = PointValueChanger.prototype.doLoad = function () { render(this); };

	/* FOR FUTURE NOTE: 
	PointValueChanger.prototype.doChanged = function (name, value) {
		  if(name === 'value') valueChanged += 'prototypeMethod - ';
		  render(this);
	};
	*/

	PointValueChanger.prototype.doDestroy = function () {
		this.jq().removeClass('PointValueChangerOuter');
		clearInterval(this.interval);
	};

	return PointValueChanger;
});

