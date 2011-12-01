// TODO refactoring & code cleanup

var labels = {
	tooltips : {
		addToFav  		: 'Dodaj do ulubionych',
		removeFav 		: 'Usuń z ulubionych'
	},
	error : {
		noResults 		: 'Niestety nie można pobrać cytatów w tym momecie. Spróbuj ponownie za chwilę.',
		noSearchResults : 'Niestety nie znaleziono odpowiadającego:<br><strong>%query%</strong>'
	},
	note : {
		noFavs 			: 'Nie oznaczono żadnego cytatu jako ulubiony.<br>Aby dodać cytat do listy ulubionych, kliknij gwiazdkę przy autorze cytatu.',
		emptyFavsList 	: 'Lista ulubionych cytatów jest pusta.'
	}
};

var urls = {
	random : 'http://polishwords.com.pl/grono/api.php?method=randomQuote',
	search : 'http://polishwords.com.pl/grono/api.php?method=tagQuote&tag=#query#'
};

function getData(url, callback) {
	$.ajax({
		type:     'GET',
		url:      url,
		dataType: 'text',
		success:  callback
	});
	track('call', 'getData');
}

function showQuote(resp) {
	track('call', 'showQuote');
	$('#addFav').removeAttr('data');
	if (typeof resp == 'object' && resp.author != '') {
		track('call', 'showQuote', 'render result');
		var out = '<blockquote><p class="quote">' + resp.quote + '</p><p class="author">— ' + resp.author 
				+ ' &nbsp; <a href="#" id="addFav" class="icon fav on fr" data-tipsy="" title="' + labels.tooltips.addToFav + '"></a>'
				+ '</p></blockquote>';
		$('section').html(out);
		$('#addFav').data('resp', resp);
		
		webdb.isFav(resp.quote, resp.author, function(tx, data){
			$('#addFav').addClass('off').removeClass('on').attr('title', labels.tooltips.addToFav);
			if (data.rows.length == 1) {
				$('#addFav').addClass('on').removeClass('off').attr('title', labels.tooltips.removeFav);
			}
		});
		
	} else {
	    if ($('#query').val() !== '') {
	    	track('call', 'showQuote', 'error', 'search no results');
	    	errText = labels.error.noSearchResults.replace('%query%', $('#query').val());
		} else {
			track('call', 'showQuote', 'error', 'no response');
			errText = labels.error.noResults;
		}
		$('section').html('<p class="error">' + errText + '</p>');
	}
    $('nav').find('aside').hide();
    $('section').show();

}

function getDailyQuote() {
	webdb.getQuote(null, function(tx, data){
		// no data - get new quote
		if (data.rows.length == 0) {
			getData(urls.random, function(resp) {
				resp = resp.split(';');
				
				// NOTE czasami w tresci schodzi autor - tu go usuwamy
				resp[0] = resp[0].replace(resp[1], '');
				
				// save quote
				webdb.addDailyQuote(resp[0], resp[1]);
				
				// display
				data = {
					ID		: 0,
					quote	: resp[0],
					author  : resp[1],
					isFav	: 0
				};
				showQuote(data);
				
			});
		} else {
			// display quote
			showQuote(data.rows.item(0));
		}
		$('section blockquote').addClass('daily');
		$('nav a:first').addClass('active');
	});
}

// event tracking
function track(category, action, label) {
	if (typeof _gaq != 'undefined') {
		if (typeof label != 'undefined') {
			_gaq.push(['_trackEvent', category, action, label]);
		} else {
			_gaq.push(['_trackEvent', category, action]);
		}
	}
}

// onload
$(function(){

	// onstart
	webdb.openDb();
	getDailyQuote();
	
	// nav items
	$('nav a').click(function(){
		$('nav a').removeClass('active');
		if (this.id != 'reload') {
			$(this).addClass('active');
		}
	});
	$('#home').click(function(e){
		e.preventDefault();
		getDailyQuote();
		track('click', '#home');
	});
	$('#reload').click(function(e){
		e.preventDefault();
		getData(urls.random, function(resp) {
			resp = resp.split(';');
			data = {
				ID		: 0,
				quote	: resp[0],
				author  : resp[1],
			};
			showQuote(data);
		});
		track('click', '#reload');
	});
	$('#addFav').live('click', function(e){
		e.preventDefault();
		elem = $(this);
		data = elem.data('resp');
		
		webdb.isFav(data.quote, data.author, function(tx, resp) {
			if (resp.rows.length == 1) {
				webdb.removeFromFav(data.quote, data.author);
				elem.addClass('off').removeClass('on').attr('title', labels.tooltips.addToFav);
				track('click', '#addFav', 'delete');
			} else {
				webdb.addToFav(data.quote, data.author);
				elem.addClass('on').removeClass('off').attr('title', labels.tooltips.removeFav);
				track('click', '#addFav', 'add');
			}
		});
	});
	$('#fav').click(function(e) {
		e.preventDefault();
		
		webdb.getFavs(function(tx, data) {
			if (data.rows.length > 0) {
				out = '';
				for (var i=0; i < data.rows.length; i++) {
					out += '<blockquote class="fav"><p class="quote">' + data.rows.item(i).quote + '</p><p class="author">— ' + data.rows.item(i).author 
						+ ' &nbsp; <a href="#" class="favRemove icon fav on fr" data-id="' + data.rows.item(i).ID + '" data-tipsy="" title="' + labels.tooltips.removeFav + '"></a>'
						+ '</p></blockquote>';
				}
			} else {
				out = '<p class="note">' + labels.note.noFavs + '</p>';
			}
			$('section').html(out);
		});
		track('click', '#fav');
	});
	$('.favRemove').live('click', function(e){
		e.preventDefault();
		$(this).parents('blockquote').fadeOut(function(){
			_list = $(this).parent('section');
			$(this).remove();
			if ($('blockquote', _list).length == 0) {
				_list.append('<p class="note">' + labels.note.emptyFavsList + '</p>');
			}
		});
		webdb.removeFromFav(null, null, $(this).data('id'));
		track('click', '.favRemove');
	});

	$('#search').click(function(e){
        e.preventDefault();
        $('nav').find('aside').show();
        $('section').hide();

        track('click', '#search', 'open');
    });
	$('#btnSearch').click(function(e){
		e.preventDefault();
		track('click', '#search', 'click');

		queryStr = $('#query').val();
	    if ($.trim(queryStr) != '') {
			sUrl = urls.search.replace('#query#', queryStr);
			getData(sUrl, function(resp) {
				resp = resp.split(';');
				data = {
					ID		: 0,
					quote	: resp[0],
					author  : resp[1],
				};
				showQuote(data);
			});
	    }
    });
	$('#query').keydown(function(e){
		if (e.keyCode == 13) {
			$('#btnSearch').click();
		}
	});
	
	$('[data-tipsy]').tipsy({live:true, opacity:1.0, gravity: 'se'});
});

// tracking: UA-27150591-2