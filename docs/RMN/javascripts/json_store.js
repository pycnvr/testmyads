(function($) {

  var app = $.sammy('#main', function() {
    this.use('Template');
    this.use('Session');

    //Setup
    this.around(function(callback) {
      var context = this;

      this.load('data/store.json')
          .then(function(store) {
            context.items = store.items;
            context.categories = store.categories;
            context.sponsoredItems = [];
          })
          .then(callback);

    });

    //Home page
    this.get('#/', function(context) {
      context.app.swap('');
      context.partial('templates/header.template');

      $.each(this.items, function(i, item) {
        context.render('templates/item.template', {id: i, item: item}).appendTo(context.$element());
      });

    });

    //Category Search
    this.get('#/cat/:id', function(context) {
      context.app.swap('');
      context.partial('templates/header.template');
      let catId = context.params['id'];
      if (!catId) { return this.notFound(); }

      context.sponsoredItems = [];
      let keywords = [];
      let unitsRequested = 1;
      let assembledRequest = requestAds({ units: unitsRequested, keywords: [], categories: [catId] });

      let that = this;
      $.post('http://dtsjc00cvx01q.dc.dotomi.net:8290/cvx/client/ctx/sponsored', JSON.stringify(assembledRequest), function(response) {

        let sponsoredAdded = processAds({response: response, keywords: keywords, categories: [catId], units: unitsRequested});
        $.each(context.items, function(i, item) {
          if(item.category === catId && !(item.id in sponsoredAdded)) {
            context.render('templates/item.template', {id: i, item: item}).appendTo(context.$element());
          }
          else if(item.category === catId){
            context.render('templates/sponsored_item.template', {id: i, item: item}).appendTo(context.$element());
          }
        });
      });


    });

    //Keyword search
    this.post('#/search', function(context) {
      context.partial('templates/header.template');
      var searchTerm = this.params['searchTerm'];
      if (!searchTerm) { return this.notFound(); }
      context.partial('templates/header.template');

      context.sponsoredItems = [];
      let categories = [];
      let unitsRequested = 2;
      let assembledRequest = requestAds({ units: unitsRequested, keywords: [searchTerm], categories: [] });

      $.post('http://dtsjc00cvx01q.dc.dotomi.net:8290/cvx/client/ctx/sponsored', JSON.stringify(assembledRequest), function(response) {

        let sponsoredAdded = processAds({response: response, keywords: [searchTerm], categories: categories, units: unitsRequested});

        $.each(context.items, function(i, item) {
          if(!(item.id in sponsoredAdded) && item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
            context.render('templates/item.template', {id: i, item: item}).appendTo(context.$element());
          }
          else if(item.id in sponsoredAdded) {
            context.render('templates/sponsored_item.template', {id: i, item: item}).appendTo(context.$element());
          }
        });
      });
    });

    //Item detail
    this.get('#/item/:id', function(context) {
      context.partial('templates/header.template');
      this.item = this.items[this.params['id']];
      if (!this.item) { return this.notFound(); }
      context.render('templates/item_detail.template', this.item).appendTo(context.$element());
    });

    //Documentation
    this.get('#/how', function(context) {
      context.partial('templates/header.template');
      context.render('templates/howto.template', this.item).appendTo(context.$element());
    });

    //Request ads
    let requestAds = function(data) {

      //Assemble

      let siteId = 201029;                       //Put your site id here
      let placementId = "ABCDEF";                //Put your placementId here
      let categories = data['categories'];
      let keywords = data['keywords'];
      let userId = "";                           //User ID
      let impSlots = [];

      for(let i=0; i < data['units']; i++){
        impSlots.push(
          {
            "id" : Math.floor(Math.random()*9000000) + 1000000,//just random 7 digit
            "tagid" : placementId,
            "displaymanager":"Prebid.js",
            "displaymanagerver":"2.2.1",
          }
        );
      }

      var assembledRequest = {
        "id" : Math.floor(Math.random()*9000000) + 1000000,//just random 7 digit
        "site" : {
          "id" :siteId ,
          "ref" : "https://yoursite.com"
        },
        "device" : {
          "h": 1024,
          "w": 768
        },
        //"user" : {
        //  "buyeruid" : userId
        //},
        "ext" : {
          "contextual" : {
            "categories" : categories,
            "keywords" : keywords
          }
        },
        "imp" : impSlots
      }

      console.log('Calling Epsilon for sponsored ads...\n\n' +  JSON.stringify(assembledRequest));

      //Post to CPE

      let success = function(){

      };

      return assembledRequest;

      /*$.ajax({
        type: 'POST',
        url: "http://dtsjc00cvx01q.dc.dotomi.net:8290/cvx/client/ctx/sponsored",
        data: JSON.stringify(assembledRequest),
        success: success,
        dataType: "json",
        async: true
      });*/

    };

    //Process Ad Response
    let processAds = function(data) {

      console.log('Epsilon sponsored ads response...\n\n' +  data.response);

      let sponsoredItems = {};
      if(data.response === ''){
        //Bad response/no bid
        //Uncomment below to test if you are having trouble getting a real bid to come back
        /*data.response = '{"id":"6565212","bidid":"71228284-a101-48fd-bdea-de3547b83181","cur":"USD","seatbid":[{"bid":[{"id":"978105889538000095","impid":"9713416","price":0.0100,"cid":"81313","crid":"40009354_4","adm_native":{"assets":[{"id":1,"required":0,"data":{"value":"4"}}],"eventtrackers":[{"event":1,"method":1,"url":"http://trackingurl1"},{"event":1,"method":1,"url":"http://trackingurl2"},{"event":1,"method":1,"url":"http://event.ad.cpe.dotomi.com/cvx/event/imp?enc=eyJ1c2VyaWQiOiI3MDEyMDUzMjgwNTEyMDQzMTAiLCJwYXJ0bmVyVHhpZCI6Ijk3ODEwNTg4OTUzODAwMDA5NSIsInR4aWQiOiI5OTk5OTIwMjcxOTczNTEwMDIiLCJuZXR3b3JrUmVxdWVzdElkIjoiOTk5OTkyMDI3MTk3MzUxMzYzIiwic2lkIjoyMDEwMjksImRpdmlzaW9uSWQiOjEsInRpZCI6MzEsIm1vYmlsZURhdGEiOiI1OSIsImJpZFByaWNlIjowLjAxMDAsInB1YkNvc3QiOjAuMDEwMCwicGFydG5lckZlZSI6MC4wMDAwLCJpcFN0cmluZyI6IjE3My4xOC4yNTMuMTk3Iiwic3VwcGx5VHlwZSI6NCwiaW50ZWdyYXRpb25UeXBlIjowLCJtZWRpYXRpb25UeXBlIjoxMjYsInBsYWNlbWVudElkIjoiMTAxMTMxMTEiLCJoZWFkZXJCaWQiOjAsImlzRGlyZWN0UHVibGlzaGVyIjoxLCJoYXNDb25zZW50IjoxLCJvcGVyYXRpb24iOiJDT05URVhUVUFMX1NQT05TT1JFRCIsImlzQ29yZVNoaWVsZCI6MCwicGFydG5lckNhbXBhaWduSWQiOiI4MTMxMyIsInBhcnRuZXJDcmVhdGl2ZUlkIjoiNDAwMDkzNTRfNCIsInNlbGxlclJlcXVlc3RJZCI6IjY1NjUyMTIiLCJzZWxsZXJJbXBJZCI6Ijk3MTM0MTYiLCJkYXRlQ3JlYXRlZCI6MTYxNDgxNjI3MjMzNn0&__EXTRA__=__MACROS__"}]}},{"id":"978105889538000094","impid":"2686374","price":0.0100,"cid":"81313","crid":"40009354_2","adm_native":{"assets":[{"id":1,"required":0,"data":{"value":"2"}}],"eventtrackers":[{"event":1,"method":1,"url":"http://trackingurl1"},{"event":1,"method":1,"url":"http://trackingurl2"},{"event":1,"method":1,"url":"http://event.ad.cpe.dotomi.com/cvx/event/imp?enc=eyJ1c2VyaWQiOiI3MDEyMDUzMjgwNTEyMDQzMTAiLCJwYXJ0bmVyVHhpZCI6Ijk3ODEwNTg4OTUzODAwMDA5NCIsInR4aWQiOiI5OTk5OTIwMjcxOTczNTEwMDEiLCJuZXR3b3JrUmVxdWVzdElkIjoiOTk5OTkyMDI3MTk3MzUxMzYzIiwic2lkIjoyMDEwMjksImRpdmlzaW9uSWQiOjEsInRpZCI6MzEsIm1vYmlsZURhdGEiOiI1OSIsImJpZFByaWNlIjowLjAxMDAsInB1YkNvc3QiOjAuMDEwMCwicGFydG5lckZlZSI6MC4wMDAwLCJpcFN0cmluZyI6IjE3My4xOC4yNTMuMTk3Iiwic3VwcGx5VHlwZSI6NCwiaW50ZWdyYXRpb25UeXBlIjowLCJtZWRpYXRpb25UeXBlIjoxMjYsInBsYWNlbWVudElkIjoiMTAxMTMxMTEiLCJoZWFkZXJCaWQiOjAsImlzRGlyZWN0UHVibGlzaGVyIjoxLCJoYXNDb25zZW50IjoxLCJvcGVyYXRpb24iOiJDT05URVhUVUFMX1NQT05TT1JFRCIsImlzQ29yZVNoaWVsZCI6MCwicGFydG5lckNhbXBhaWduSWQiOiI4MTMxMyIsInBhcnRuZXJDcmVhdGl2ZUlkIjoiNDAwMDkzNTRfMiIsInNlbGxlclJlcXVlc3RJZCI6IjY1NjUyMTIiLCJzZWxsZXJJbXBJZCI6IjI2ODYzNzQiLCJkYXRlQ3JlYXRlZCI6MTYxNDgxNjI3MjMzNn0&__EXTRA__=__MACROS__"}]}}]}]}';
        */
        return sponsoredItems;
      }

      let response = JSON.parse(data.response);
      hasBids = false;

      try {
        hasBids = response.seatbid[0].bid.length > 0;

        for(let i = 0 ; i < response.seatbid[0].bid.length; i++){
          let imp = response.seatbid[0].bid[i];
          try{
            let sku = parseInt(imp.adm_native.assets[0].data.value);
            sponsoredItems[sku] = 1;;
            console.log('Sponsored item found, SKU: ' + sku);
          }
          catch(err){
            console.log(err);
          }
        }
      }
      catch (err){
        console.log(err);
      }

      return sponsoredItems;
    };

    //App run
    this.bind('run', function() {});

  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
