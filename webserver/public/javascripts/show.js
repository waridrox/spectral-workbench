$.ajaxSetup ({ cache: false }); 

var ajax_load = "<img src='/images/spinner-small.gif' alt='loading...' />";

spectrum = ""
data = []
$W = {
	updateLegendTimeout: null,
	initialize: function(args) {
		this.spectrum_id = args['spectrum_id']
		this.form_authenticity_token = args['form_authenticity_token']
		this.title = args['title']
		spectrum = args['spectrum_data']
		data = [{label: $W.title+" = 0% ",data:[]}]
		$.each(spectrum.lines,function(index,line) {
			if (line.wavelength == null) {
				line.wavelength = index
				scaled = false
			}
			data[0].data.push([line.wavelength,line.average/(2.55)])
		})
		this.plot = $.plot($("#graph"),data,flotoptions);

		this.init_hovers();
		$("#compareForm").submit(function(){
			var url = "/spectrums/compare/"+$W.spectrum_id+"?q="+$("#searchinput").val();
			$("#result").html(ajax_load).load(url);
		});
		$('#units').click(function() {
			if (flotoptions.xaxis.tickFormatter == wavenumbers) {
				flotoptions.xaxis.tickFormatter = nanometers
				flotoptions.xaxis.tickSize = 100
			} else {
				flotoptions.xaxis.tickFormatter = wavenumbers
				flotoptions.xaxis.tickSize = wavenumber_tickSize
			}
			$.plot($("#graph"),data,flotoptions);
		})
		$('#createSet').click(function() {
			var f = document.createElement('form');
			f.style.display = 'none';
			$('#graph').append(f);
			f.id = "createsetform"
			var i = document.createElement('input');
			i.name = "authenticity_token"
			i.value = $W.form_authenticity_token
			$('#createsetform').append(i);
			f.method = 'POST';
			f.action = "/sets/new/"+spectra.join(',')
			f.submit();
		})
		$('#extract').click(function() {
			var f = document.createElement('form');
			f.style.display = 'none';
			$('#graph').append(f);
			f.id = "extractform"
			var i = document.createElement('input');
			i.name = "authenticity_token"
			i.value = $W.form_authenticity_token
			$('#extractform').append(i);
			f.method = 'POST';
			f.action = "/spectrums/extract/"+$W.spectrum_id
			f.submit();
		})
		$('#clone').click(function() {
			// use uniq_id as a CSS class, only show those from the same device
			$('.cloneCalibration').show()
		})
		// we could switch to "selection" http://people.iola.dk/olau/flot/examples/selection.html
		$('#calibrate').click(function() {
			$("#toolbar_notification").html("Click on the middle blue band (<a href='http://publiclaboratory.org/wiki/spectral-workbench-calibration'>Learn more</a>)")
			// observe clicks to graph:
			$("#graph").bind("plotclick", function (event, pos, item) {
				$W.second_calibration(pos.x,435.833)
				// axis coordinates for other axes, if present, are in pos.x2, pos.x3, ...
			});
		})		
		$('#embedcode').click(function() {
			this.focus()
			this.select()
		})
	},

	init_hovers: function() {
		$("#graph").bind("plothover",  function (event, pos, item) {
			latestPosition = pos;
			if (!$W.updateLegendTimeout)
				$W.updateLegendTimeout = setTimeout($W.updateLegend, 50);
		});
		legends = $("#graph .legendLabel");
		legends.each(function () {
			// fix the widths so they don't jump around
			$(this).css('width', $(this).width()+10);
		});
	},

	updateLegend: function() {
		$W.updateLegendTimeout = null;
	
		var pos = latestPosition;
	
		var axes = $W.plot.getAxes();
		if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
			pos.y < axes.yaxis.min || pos.y > axes.yaxis.max)
			return;
	
		var i, j, dataset = $W.plot.getData();
		for (i = 0; i < dataset.length; ++i) {
			var series = dataset[i];
	
			// find the nearest points, x-wise
			for (j = 0; j < series.data.length; ++j)
				if (series.data[j][0] > pos.x)
				break;
	
			// now interpolate
			var y, p1 = series.data[j - 1], p2 = series.data[j];
			if (p1 == null)
				y = p2[1];
			else if (p2 == null)
				y = p1[1];
			else
				y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
		
			$('#wavelength').html(parseInt(pos.x))
			legends.eq(i).html(series.label.replace(/=.*%/, "= " + parseInt(y) + "%"));
		}
	},

	second_calibration: function(x1,w1) {
		$("#toolbar_notification").html("Click on the bright green band")
		// observe clicks to graph:
		$("#graph").bind("plotclick", function (event, pos, item) {
			$W.complete_calibration(x1,w1,pos.x,546.074)
		});
	},

	complete_calibration: function(x1,w1,x2,w2) {
		$("#toolbar_notification").html("Calibrating...")
		var f = document.createElement('form');
		f.style.display = 'none';
		$('#graph').append(f);
		f.id = "calibrateform"
		var i = document.createElement('input');
		i.name = "authenticity_token"
		i.value = $W.form_authenticity_token
		$('#calibrateform').append(i);
		f.method = 'POST';
		f.action = "/spectra/calibrate/"+$W.spectrum_id+"?x1="+x1+"&w1="+w1+"&x2="+x2+"&w2="+w2
		f.submit();
	},

}

scaled = true
flotoptions.xaxis.show = scaled

var legends;
var latestPosition = null;
