/* global JsUtils */

function defineFuncForTabSpacing () {

	////////// Hard Coded Defs //////////
	const arePrimitiveValsInObjsSame = (obj1, obj2) => !Object.keys(obj1).some(key => (obj1[key] === null || (typeof obj1[key] !== 'object' && typeof obj1[key] !== 'function')) && obj1[key] !== obj2[key])
	// 0 layers means obj only has primitive values
	// this func only works with obj literals or arrays layered with obj literals or arrays until base layer only primitive
	const checkNestedObjectsEquivalence = (objA, objB, layers) => {
		if (layers === 0) {
			return arePrimitiveValsInObjsSame(objA, objB);
		} else {
			const objAKeys = Object.keys(objA);
			const objBKeys = Object.keys(objB);
			if (objAKeys.length !== objBKeys.length) return false;
			const somethingIsNotEquivalent = objAKeys.some(key => !checkNestedObjectsEquivalence(objA[key], objB[key], layers - 1));
			return !somethingIsNotEquivalent;
		}
	};
	const needToRedrawWidget = (widget, newData) => {
		const lastData = widget.data;
		// check primitives for equivalence
		if (!arePrimitiveValsInObjsSame(lastData, newData)) return true;
		// check nested arrays for equivalence
		const monthlyModulesAreSame = checkNestedObjectsEquivalence(lastData.tableData, newData.tableData, 2);
		if (!monthlyModulesAreSame) return true;
		//return false if nothing prompted true
		return false;
	};
	const margin = 5;


	////////////////////////////////////////////////////////////////
		// Define Widget Constructor & Exposed Properties
	////////////////////////////////////////////////////////////////
	const properties = [
		/* COLORS */
		//fills
		{
			name: 'backgroundColor',
			value: 'white',
			typeSpec: 'gx:Color'
		},
		//strokes
		{
			name: 'gridStrokeColor',
			value: 'grey',
			typeSpec: 'gx:Color'
		},
		//text
		{
			name: 'xAxisTicksTextColor',
			value: 'black',
			typeSpec: 'gx:Color'
		},
		/* FONT */
		{
			name: 'xAxisTicksTextFont',
			value: 'bold 8.0pt Nirmala UI',
			typeSpec: 'gx:Font'
		},
	/* PADDING */
		{
			name: 'paddingBetweenTHINGS',
			value: 5
		},
	/* OTHER */
		{
			name: 'overrideDefaultPrecisionWFacets',
			value: false
		},
		{
			name: 'minDegreesCategory',
			value: 30
		},
	];



	////////////////////////////////////////////////////////////////
		// /* SETUP DEFINITIONS AND DATA */
	////////////////////////////////////////////////////////////////
	const setupDefinitions = widget => {
		// FROM USER // 
		const data = {};
		properties.forEach(prop => data[prop.name] = prop.value);

		// FROM JQ //
		data.jqHeight = 150;
		data.jqWidth = 150;

		// SIZING //
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);

		// GLOBALS PER INSTANCE //
		if (!widget.hovered) widget.hovered = { optimized: false, standard: false, current: 'neither' };
		if (!widget.activeModule) widget.activeModule = 'none';
		if (!widget.percentIsHovered) widget.percentIsHovered = false;

		// DATA TO POPULATE //
		data.fakeData = [];

		// FAKE DATA //
		const populateFakeData = () => {
			data.fakeData.unshift('datum1');




		};



		// CALCULATED DEFS //
		const calculateDefs = () => {







			return data;
		};

		populateFakeData();
		return calculateDefs();
	};
		




	////////////////////////////////////////////////////////////////
		// RenderWidget Func
	////////////////////////////////////////////////////////////////

	const renderWidget = (widget, data) => {
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

	

		const graphicGroup = widget.svg.append('g').attr('class', 'graphicGroup');


		const centeredGroup = graphicGroup.append('g')
			.attr('class', 'centeredGroup')
			.attr('transform', `translate(${data.jqWidth / 2}, ${data.jqHeight / 2})`);
		
		// ********************************************* OUTER ELLIPSE ******************************************************* //
		centeredGroup.append('ellipse')
			.attr('rx', 40)
			.attr('ry', 20)

	};
	






	////////////////////////////////////////////////////////////////
		// Render Func
	////////////////////////////////////////////////////////////////

	function render(widget, force) {
		// invoking setupDefinitions, then returning value to renderWidget func
		let theData = setupDefinitions(widget);
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