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
			},
			{
				name: 'labelOverride',
				value: 'null'
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
		data.jqHeight = jq.height() || 50;
		data.jqWidth = jq.width() || 105;
		data.graphicHeight = data.jqHeight - (margin * 2);
		data.graphicWidth = data.jqWidth - (margin * 2);


		// GET DATA
		const point = widget.value()

		if (point) {
			//get value
			data.value = point.get('out').get('value');
			//get displayName
			const widgetValueDisplayName = point.getNavDisplayName();
			data.displayName = data.labelOverride === 'null' ? widgetValueDisplayName : data.labelOverride;
			//get facets
			const facets = point.get('facets');
			let precision;
			if (facets) {
				data.units = facets.get('units', '');
				precision = facets.get('precision', 1);
			} else {
				data.units = '';
				precision = 1;
			}
			//get displayValue
			data.displayValue = JsUtils.formatValueToPrecision(data.value, precision);
			//function for changing value
			data.changeValue = newValue => {
				return point.invoke({slot: 'set', value: +newValue})
				.then(() => render(widget, true))
				.catch(err => console.error(data.displayName + ' value change error: ' + err))
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


	function render(widget, force) {
		// invoking setupDefinitions, then returning value from successful promise to renderWidget func
		const data = setupDefinitions(widget);
		if (data) {
			if ( force || !widget.data || needToRedrawWidget(widget, data) ) renderWidget(widget, data);
			widget.data = data;
		} else {
			console.error('No point currently bound to Point Value Changer')
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

