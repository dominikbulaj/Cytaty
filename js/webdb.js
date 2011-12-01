var webdb = {
	db: null, // connection handler

	openDb: function() {
		dbSize = 5 * 1024 * 1024; // 5MB
		webdb.db = openDatabase('quotes', '1.0', 'Cytaty dnia', dbSize);
		// create table
		webdb.createTableQuotes();
	},

	onError: function(tx, e) {
		console.error('Wystąpił błąd:\n' + e.message);
		return false;
	},
	
	onSuccess: function(tx, r) {
		return true;
	},
	
	createTableQuotes: function() {
		webdb.db.transaction(function(tx) {
		    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
		                  'quotes(ID INTEGER PRIMARY KEY ASC, quote TEXT , author TEXT, date DATE, favDate DATE)', []);
		    tx.executeSql('CREATE INDEX IF NOT EXISTS idx1 ON quotes(quote, author)', []);
		    tx.executeSql('CREATE INDEX IF NOT EXISTS idx2 ON quotes(date)', []);
		    tx.executeSql('CREATE INDEX IF NOT EXISTS idx3 ON quotes(favDate)', []);
		});
	},
	
	addDailyQuote: function(quote, author) {
		webdb.db.transaction(function(tx){
			
		    tx.executeSql('SELECT * FROM quotes WHERE quote=? AND author=?', [quote, author], function(tx, r) {
		    	if (r.rows.length == 1) {
		    		tx.executeSql('UPDATE quotes SET date=date("now") WHERE ID=?', 
		    				[r.rows.item(0).ID],
		    				webdb.onSuccess,
		    				webdb.onError);
		    	} else {
				    tx.executeSql('INSERT INTO quotes(quote, author, date) VALUES (?,?,date("now"))', 
			    		[quote, author],
				        webdb.onSuccess,
				        webdb.onError);
		    	}
		    }, webdb.onError);
	    });
	},
	
	addToFav: function(quote, author) {
		webdb.db.transaction(function(tx){
			
		    tx.executeSql('SELECT * FROM quotes WHERE quote=? AND author=?', [quote, author], function(tx, r) {
		    	if (r.rows.length == 1) {
		    		tx.executeSql('UPDATE quotes SET favDate=datetime("now") WHERE ID=?', 
		    				[r.rows.item(0).ID],
		    				webdb.onSuccess,
		    				webdb.onError);
		    	} else {
				    tx.executeSql('INSERT INTO quotes(quote, author, favDate) VALUES (?,?,datetime("now"))', 
				        [quote, author],
				        webdb.onSuccess,
				        webdb.onError);
		    	}
		    }, webdb.onError);
	    });
	},
	
	removeFromFav: function(quote, author, id) {
		webdb.db.transaction(function(tx){
			if (typeof id != 'undefined') {
				tx.executeSql('UPDATE quotes SET favDate=null WHERE ID=?', [id]); 
				
			}
		    tx.executeSql('UPDATE quotes SET favDate=null WHERE quote=? AND author=?', 
		        [quote, author],
		        webdb.onSuccess,
		        webdb.onError);
	    });
	},
	
	getFavs: function(callback) {
		webdb.db.transaction(function(tx){
		    tx.executeSql('SELECT * FROM quotes WHERE favDate != "" ORDER BY favDate DESC', [], callback, webdb.onError);
		});
	},
	
	isFav: function(quote, author, callback) {
		webdb.db.transaction(function(tx){
			tx.executeSql('SELECT favDate FROM quotes WHERE favDate != "" AND quote=? AND author=?', [quote, author], callback, webdb.onError);
		});
	},
	
	// byId & byDate
	getQuote : function(id, callback) {
		webdb.db.transaction(function(tx){
			if (typeof id != 'undefined' && id > 0) {
				tx.executeSql('SELECT * FROM quotes WHERE ID=?', [id], callback, webdb.onError);
			} else {
				tx.executeSql('SELECT * FROM quotes WHERE date=date("now")', [], callback, webdb.onError);
			}
		});
	},
	
	// TODO:
	// 2. historia prev/next
	// 2.1 - czy ma element (zwroci date)
	
};