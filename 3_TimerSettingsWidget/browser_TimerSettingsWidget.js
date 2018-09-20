/* global JsUtils */

function defineFuncForTabSpacing () {

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
	const properties = [
		{
			name: 'backgroundColor',
			value: 'white',
			typeSpec: 'gx:Color'
		}
	];



	////////////////////////////////////////////////////////////////
		// /* SETUP DEFINITIONS AND DATA */
	////////////////////////////////////////////////////////////////
	const setupDefinitions = widget => {
		// FROM USER // 
		const data = {};
		properties.forEach(prop => data[prop.name] = prop.value);

		// FROM JQ //
		data.jqHeight = 100;
		data.jqWidth = 210;

		// SIZING //
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// DATA TO POPULATE //
			data.displayName = 'On Timer'

			data.timerRunning = true;

			data.preset = {
				hours: 5,
				minutes: 30,
				seconds: 15
			};
			data.preset.setValue = 	({hours, minutes, seconds}) => {
				if (hours || hours === 0) data.preset.hours = hours;
				if (minutes || minutes === 0) data.preset.minutes = minutes;
				if (seconds || seconds === 0) data.preset.seconds = seconds;
				data.presetHours = data.preset.hours;
				data.presetMinutes = data.preset.minutes;
				data.presetSeconds = data.preset.seconds;
				return Promise.resolve();
			}

			data.presetHours = data.preset.hours;
			data.presetMinutes = data.preset.minutes;
			data.presetSeconds = data.preset.seconds;

			data.bypassTimer = () => console.log('timer bypassed')
			data.resetTimer = () => console.log('timer reset')



		return data;

	};
		




	////////////////////////////////////////////////////////////////
		// RenderWidget Func
	////////////////////////////////////////////////////////////////

	const renderWidget = (widget, data) => {
		// ********************************************* BROWSER ONLY ******************************************************* //
		widget.outerDiv 
			.style('height', data.jqHeight + 'px')	//only for browser
			.style('width', data.jqWidth + 'px')		//only for browser
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
	






	////////////////////////////////////////////////////////////////
		// Render Func
	////////////////////////////////////////////////////////////////

	function render(widget, force) {
		// invoking setupDefinitions, then returning value to renderWidget func
		let theData = setupDefinitions(widget);
		// if (force || !widget.data || needToRedrawWidget(widget, theData)){
			renderWidget(widget, theData);	
		// }
		widget.data = theData;
	}






	////////////////////////////////////////////////////////////////
		// Initialize Widget
	////////////////////////////////////////////////////////////////
	function initialize() {
		const widget = {};

		widget.outerDiv = d3.select('#outer')
			.style('overflow', 'hidden');
		widget.svg = widget.outerDiv.append('svg')
			.attr('class', 'log')
			.style('overflow', 'hidden');

		render(widget);
	}





initialize();

}

defineFuncForTabSpacing();