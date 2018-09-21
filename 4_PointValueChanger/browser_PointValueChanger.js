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
		},
		{
			name: 'labelOverride',
			value: 'null'
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
		data.jqHeight = 110;
		data.jqWidth = 130;

		// SIZING //
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// DATA TO POPULATE //
		widget.value = 2.5
		const facets = {units: 'F', precision: 1};
		const precision = facets.precision;
		data.displayValue = JsUtils.formatToPrecision(widget.value, precision);
		data.displayName = data.labelOverride === 'null' ? 'Supply Offset' : data.labelOverride;
		data.units = facets.units;

		
		data.changeValue = newValue => {
			return widget.value.invoke({slot: 'set', value: +newValue})
			.then(() => render(widget, true))
			.catch(err => console.error(data.displayName + ' value change error: ' + err))
		}


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
		const titleFont = '12.0pt Nirmala UI'
		const buttonTextHeight = JsUtils.getTextHeight(buttonFont);
		const titleTextHeight = JsUtils.getTextHeight(titleFont);
		const verticalBoxPadding = 3;
		const horizontalBoxPadding = 12;
		const buttonHeight = buttonTextHeight + (verticalBoxPadding * 3)
		const rowHeight = d3.max([buttonHeight, titleTextHeight]);
		const spaceBetweenRows = 10;
		const valueWidth = JsUtils.getTextWidth(data.displayValue, buttonFont);
		const valueBoxWidth = valueWidth + (horizontalBoxPadding * 2);
		const unitLabelWidth = JsUtils.getTextWidth(data.units, buttonFont);
		const spaceRightOfBox = 3;
		const rectStrokeColor = 'silver';
		const rectHoverStrokeColor = 'gray'
		const rectClickColor = 'gray'
		const textColor = '#404040'
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

		const row1 = graphicGroup.append('g').attr('class', 'row1').style('font', buttonFont)
		const row2 = graphicGroup.append('g').attr('class', 'row2').style('font', titleFont)

		// ********************************************* ROW 1 ******************************************************* //

			//hours
		const hoursGroup = row1.append('g').attr('class', 'hoursGroup')
			.on('mouseover', () => hoursRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => hoursRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => hoursRect.attr('fill', rectClickColor))
			.on('mouseup', () => hoursRect.attr('fill', data.backgroundColor))
			.on('click', function() {
				const hoursPrompt = prompt('Set Preset Hours', hoursDisplay)
				if (hoursPrompt == null || hoursPrompt == "" || hoursPrompt == hoursDisplay) {
					console.log('cancel')
				} else if (hoursPrompt.length > 5 || isNaN(hoursPrompt)) {
					alert('Set hours must be numbers with a max of 5 digits')
				} else {
					data.preset.setValue({hours: hoursPrompt})
						.then(() => renderWidget(widget, data))
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
			.attr('x', hoursBoxWidth + spaceRightOfBox)

		// ********************************************* ROW 2 ******************************************************* //
			graphicGroup.select('.row2').append('text')
			.style('font', titleFont)
			.text(data.displayName)
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