/* global JsUtils Meter*/

function defineFuncForTabSpacing () {

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
	const properties = [
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
	];



	////////////////////////////////////////////////////////////////
		// /* SETUP DEFINITIONS AND DATA */
	////////////////////////////////////////////////////////////////
	const setupDefinitions = widget => {
		// FROM USER // 
		const data = {};
		properties.forEach(prop => data[prop.name] = prop.value);

		// FROM JQ //
		data.jqHeight = 45;
		data.jqWidth = 160;

		// SIZING //
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// FAKE DATA //
		const populateFakeData = () => {


			data.meterValue = 88
			data.units = '$USD'
			data.precision = 0
			data.meterLabel = 'hereIam'


		};



		// CALCULATED DEFS //
		const calculateDefs = () => {


			
		// GLOBALS PER INSTANCE //
		if (!widget.meterValue) widget.meterValue = data.meterValue;
		if (!widget.units) widget.units = data.units;
		if (!widget.precision) widget.precision = data.precision;
		// if (!widget.isCurrentlyHovered) widget.isCurrentlyHovered = false;


			return data;
		};

		populateFakeData();
		return calculateDefs();
	};
		




	////////////////////////////////////////////////////////////////
		// RenderWidget Func
	////////////////////////////////////////////////////////////////

	const renderWidget = (widget, data) => {
		// ********************************************* SIZING ETC ******************************************************* //
		const meterTitleFont = '10.0pt Nirmala UI';
		const meterUnitsFont = 'bold 10.0pt Nirmala UI';
		const meterNumFont = 'bold 10.0pt Nirmala UI';
		const meterHeight = 12;
		const meterObjHeight = Meter.getHeightFromMeterHeight(meterHeight, meterTitleFont, meterUnitsFont, meterNumFont);	//36.3


		// ********************************************* DRAW ******************************************************* //
		widget.outerDiv 
			.style('height', data.jqHeight + 'px')	//only for browser
			.style('width', data.jqWidth + 'px')		//only for browser

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
			(data.units || ''),
			(data.precision || 0),
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

	
			console.log(data)
		}



	////////////////////////////////////////////////////////////////
		// Render Func
	////////////////////////////////////////////////////////////////

	
	function render(widget, force) {
		// invoking setupDefinitions, then returning value to renderWidget func
		let theData = setupDefinitions(widget);
		//if value data has changed, change value data
		if (widget.data) {
			const newArgsObj = {};
			let valueChanged = false;
			if (widget.meterValue !== theData.meterValue) {
				newArgsObj.meterVal = theData.meterValue;
				widget.meterValue = theData.meterValue
				valueChanged = true;
			}
			if (widget.precision !== theData.precision) {
				newArgsObj.precision = theData.precision;
				widget.precision = theData.precision
				valueChanged = true;
			}
			if (widget.units !== theData.units) {
				newArgsObj.units = theData.units;
				widget.units = theData.units
				valueChanged = true;
			}
			if (valueChanged) widget.meter.redrawWithNewArgs(newArgsObj);
		}

		if (force || !widget.data || needToRedrawWidget(widget, theData)){
			renderWidget(widget, theData);
		}

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