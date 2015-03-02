function createDropDown(id,filterid,title,list){
    var html="<h5>"+title+"</h5><select id='"+filterid+"'><option selected>All</option>";
    list.forEach(function(e){
        html += '<option value="'+e.key+'">' + e.key + '</option>';
    });
    html+="</select>";
    $(id).html(html);
}

function populateTable(list){
    var html = "<table><tr><th>Préfecture</th><th>Axes d'interventions</th><th>Organisation</th><th>Activité</th><th>Description</th></tr>";
    list.forEach(function(e){
        html += "<tr><td>" + e.Region + "</td><td>" + e.Sector + "</td><td>" + e.Organisation + "</td><td>" + e.Activity_Type + "</td><td>" + e.Activity_Description + "</td></tr>";
    });
    html +="</table>";
    $("#information_table").html(html);
}

function updateMap(list){
    var colors=["#FFFF8D","#FFFF00","#FFEA00","#FFD600"];
    d3.selectAll("path").attr("opacity",0.4);
    d3.selectAll("path").attr("fill","#eeeeee");
    list.forEach(function(e){
        if(e.key!="#N/A"&&e.value>0){
            d3.selectAll("#"+e.key).attr("opacity",0.6);
            d3.selectAll("path").attr("fill-opacity",1);
            d3.selectAll("path").attr("stroke","steelblue");
            d3.selectAll("path").attr("stroke-width",2);
            if(e.value<=2){
                d3.selectAll("#"+e.key).attr("fill",colors[0]);
            } else if (e.value<=4) {
                d3.selectAll("#"+e.key).attr("fill",colors[1]);
            } else if (e.value<=8) {
                d3.selectAll("#"+e.key).attr("fill",colors[2]);
            } else {
                d3.selectAll("#"+e.key).attr("fill",colors[3]);    
            }
        }; 
    });
}

function setRegionFilter(list){
    list.forEach(function(e){
        if(e.key!="#N/A"&&e.value>0){$("#regionDD").val(e.key);};
    });
}

function reduceFilter(id,list){
    list.forEach(function(e){
        if(e.value==0){
            $('#'+id+' option[value="'+e.key+'"]').attr('disabled','disabled');
        } else {
            $('#'+id+' option[value="'+e.key+'"]').removeAttr('disabled');
        } 
    });
}

function reduceAllFilters(){
    reduceFilter("regionDD",cf.countByRegion.all());
    reduceFilter("orgDD",cf.countByOrg.all());
    reduceFilter("domainDD",cf.countBySector.all());
    reduceFilter("activityDD",cf.countByActivity.all());
}

function initMap(){
    //var base_hotosm = L.tileLayer(
    //    'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{
    //    attribution: '&copy; OpenStreetMap contributors, <a href="http://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>'}
    //);
    
    var base_google = new L.Google('ROADMAP');
    
    var map = L.map('map', {
        center: [9.9,-11.5],
        zoom: 7,
        layers: [base_google]
    });
    
    var overlay_prefectures = L.geoJson(prefectures,{
        onEachFeature:function(feature, layer) {
            layer.on('click', function (e) {
                popUpContent(e.target.feature.properties.ADM2_CODE);
                cf.byRegion_id.filterAll();
                cf.byRegion.filterAll();
                cf.byRegion_id.filter(e.target.feature.properties.ADM2_CODE);                
                populateTable(cf.byActivity.bottom(Infinity));  
                setRegionFilter(cf.countByRegion.all());
                updateMap(cf.countByRegion_id.all());
                reduceAllFilters();
            });
            layer.on('mouseover',function(e){
            if($("#regionDD").val()==="All"){    
                popUpContent(e.target.feature.properties.ADM2_CODE);
            }
            });
            layer.on('mouseout',function(e){
            if($("#regionDD").val()==="All"){
                popUpContent("");
            }
            });               
        }
    }).addTo(map);     
    
    overlay_prefectures.eachLayer(function (layer) {
        if(typeof layer._path != 'undefined'){
            layer._path.id = layer.feature.properties.ADM2_CODE;
        } else {
            layer.eachLayer(function (layer2){
                layer2._path.id = layer.feature.properties.ADM2_CODE;
            });
        }
    });
}

function popUpContent(id){
    if(id==""){
        var html="Faites passer la souris au-dessus d'une région pour afficher les organisations qui y travaillent.";
    } else {
        var i=0;
        var html ="<h4>Organisations à ";
        cf.byRegion_id.filter(id);
        cf.countByRegion2.all().forEach(function(e){
            if(e.value>0){
                html+=e.key+": </h4>";
            } 
        });
        cf.countByOrg2.all().forEach(function(e){
            if(e.value>0){
                i++;
                if(i<16){
                    html+=e.key+", ";
                }
            }
        });
        if(i>15){
            i=i-10;
            html+="et " +i+" autre";
        }

        cf.byRegion_id.filterAll();
        cf.byRegion.filterAll();
        if($("#regionDD").val()!="All"){
            cf.byRegion.filter($("#regionDD").val());
        }
    }
    
    $("#popup").html(html);
}

var sql = 'SELECT * FROM "3ee593d4-d7aa-4c7a-8c2c-5e5fd192bb45"';

var ajaxData = encodeURIComponent(JSON.stringify({sql: sql}));


var dataCall = $.ajax({
    type: 'POST',
    dataType: 'json',
    url: 'https://data.hdx.rwlabs.org/api/3/action/datastore_search_sql',
    data: ajaxData,
});

var cf;

$.when(dataCall).then(function(dataArgs){

    cf = crossfilter(dataArgs.result.records);
    cf.bySector = cf.dimension(function(d){return d.Sector;});
    cf.countBySector = cf.bySector.group();

    createDropDown("#sector_filter","domainDD","Axes d'interventions",cf.countBySector.all());

    $("#domainDD").change(function() {
        if($(this).val()=="All"){
            cf.bySector.filterAll();
        } else {
            cf.bySector.filterAll();
            cf.bySector.filter($(this).val());
        }
        populateTable(cf.byActivity.bottom(Infinity));
        updateMap(cf.countByRegion_id.all());
        reduceAllFilters();
    });

    cf.byActivity = cf.dimension(function(d){return d.Activity_Type.substring(0, 40);});
    cf.countByActivity = cf.byActivity.group();

    createDropDown("#activity_filter","activityDD","Activité",cf.countByActivity.all());

    $("#activityDD").change(function() {
        if($(this).val()=="All"){
            cf.byActivity.filterAll();
        } else {
            cf.byActivity.filterAll();
            cf.byActivity.filter($(this).val());
        }
        populateTable(cf.byRegion.bottom(Infinity));
        updateMap(cf.countByRegion_id.all());
        reduceAllFilters();
    });

    cf.byRegion = cf.dimension(function(d){return d.Region;});
    cf.countByRegion = cf.byRegion.group();

    cf.byRegion2 = cf.dimension(function(d){return d.Region;});
    cf.countByRegion2 = cf.byRegion.group();

    createDropDown("#region_filter","regionDD","Préfecture",cf.countByRegion.all());

    $("#regionDD").change(function() {
        if($(this).val()=="All"){
            cf.byRegion.filterAll();
            cf.byRegion_id.filterAll();
        } else {
            cf.byRegion.filterAll();
            cf.byRegion_id.filterAll();
            cf.byRegion.filter($(this).val());
        }
        populateTable(cf.byActivity.bottom(Infinity));
        updateMap(cf.countByRegion_id.all());
        reduceAllFilters();
    });

    cf.byOrg = cf.dimension(function(d){return d.Organisation;});
    cf.countByOrg = cf.byOrg.group();
    cf.byOrg2 = cf.dimension(function(d){return d.Organisation;});
    cf.countByOrg2 = cf.byOrg2.group();

    createDropDown("#org_filter","orgDD","Organisation",cf.countByOrg.all());

    $("#orgDD").change(function() {
        if($(this).val()=="All"){
            cf.byOrg.filterAll();
        } else {
            cf.byOrg.filterAll();
            cf.byOrg.filter($(this).val());
        }
        populateTable(cf.byRegion.bottom(Infinity));
        updateMap(cf.countByRegion_id.all());
        reduceAllFilters();
    });

    $("#reset").on("click",function(){
        cf.byOrg.filterAll();
        cf.byRegion.filterAll();
        cf.byRegion_id.filterAll();
        cf.bySector.filterAll();
        cf.byActivity.filterAll();
        $("#orgDD").val("All");
        $("#activityDD").val("All");
        $("#regionDD").val("All");
        $("#domainDD").val("All");
        populateTable(cf.byActivity.bottom(Infinity));
        updateMap(cf.countByRegion_id.all());
        reduceAllFilters();    
    });

    cf.byRegion_id = cf.dimension(function(d){return d.P_Code;});
    cf.byRegion_id2 = cf.dimension(function(d){return d.P_Code;});
    cf.countByRegion_id = cf.byRegion_id2.group();

    populateTable(cf.byActivity.bottom(Infinity));
    initMap();
    updateMap(cf.countByRegion_id.all());
});