/* global JsUtils */

function defineFuncForTabSpacing () {

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
		data.jqHeight = 50;
		data.jqWidth = 105;

		// SIZING //
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// DATA TO POPULATE //
		if (!widget.value) widget.value = 2.5
		data.value = widget.value;
		const facets = {units: 'F', precision: 1};
		const precision = facets.precision;
		const widgetValueDisplayName = 'Supply Offset'

		data.displayName = data.labelOverride === 'null' ? widgetValueDisplayName : data.labelOverride;
		data.units = facets.units || '';
		data.displayValue = JsUtils.formatValueToPrecision(data.value, precision);


		data.changeValue = newValue => {
			widget.value = newValue;
			render(widget, true);
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
		const verticalBoxPadding = 2;
		const horizontalBoxPadding = 20;
		const buttonHeight = buttonTextHeight + (verticalBoxPadding * 3)
		const spaceBetweenRows = 2;
		const valueWidth = JsUtils.getTextWidth(data.displayValue, buttonFont);
		const valueBoxWidth = valueWidth + (horizontalBoxPadding * 2);
		const spaceRightOfBox = 5;
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
		const row2 = graphicGroup.append('g').attr('class', 'row2').style('font', titleFont).attr('transform', `translate(0, ${buttonHeight + spaceBetweenRows + titleTextHeight})`)

		// ********************************************* ROW 1 ******************************************************* //
		const valueButton = row1.append('g').attr('class', 'valueButton')
			.on('mouseover', () => valueRect.attr('stroke', rectHoverStrokeColor))
			.on('mouseout', () => valueRect.attr('stroke', rectStrokeColor))
			.on('mousedown', () => valueRect.attr('fill', rectClickColor))
			.on('mouseup', () => valueRect.attr('fill', data.backgroundColor))
			.on('click', function() {
				const valuePrompt = prompt('Set ' + data.displayName + ' value', data.displayValue)
				if (valuePrompt == null || valuePrompt == "" || valuePrompt == data.displayValue || valuePrompt == data.value) {
				} else if (isNaN(valuePrompt)) {
					alert('Input value must be a number');
				} else {
					data.changeValue(valuePrompt);
				}
			})
		const valueRect = valueButton.append('rect')
			.attr('height', buttonHeight)
			.attr('width', valueBoxWidth)
			.attr('stroke', rectStrokeColor)
			.attr('fill', data.backgroundColor)
			.attr('rx', 2.5)
			.attr('ry', 2.5)
		const valueText = valueButton.append('text')
			.text(data.displayValue)
			.attr('y', verticalBoxPadding + buttonTextHeight)
			.attr('x', horizontalBoxPadding);
		const unitsLabel = row1.append('text')
			.text(data.units)
			.attr('y', verticalBoxPadding + buttonTextHeight)
			.attr('x', valueBoxWidth + spaceRightOfBox)

		// ********************************************* ROW 2 ******************************************************* //
			row2.append('text')
				.style('font', titleFont)
				.text(data.displayName)




		graphicGroup.selectAll('text').attr('fill', textColor)
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