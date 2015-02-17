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
        html += "<tr><td>" + e.region + "</td><td>" + e.sector + "</td><td>" + e.org + "</td><td>" + e.activity_type + "</td><td>" + e.x_activity + "</td></tr>";
    });
    html +="</table>";
    $("#information_table").html(html);
}

function updateMap(list){
    var colors=["#FFFF8D","#FFFF00","#FFEA00","#FFD600"];
    d3.selectAll("path").attr("opacity",0.1);
    d3.selectAll("path").attr("fill","#cccccc");
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
    reduceFilter("regionDD",countByRegion.all());
    reduceFilter("orgDD",countByOrg.all());
    reduceFilter("domainDD",countBySector.all());
    reduceFilter("activityDD",countByActivity.all());
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
                byRegion_id.filterAll();
                byRegion.filterAll();
                byRegion_id.filter(e.target.feature.properties.ADM2_CODE);
                populateTable(byActivity.bottom(Infinity));  
                setRegionFilter(countByRegion.all());
                updateMap(countByRegion_id.all());
                reduceAllFilters();
            });
            layer.on('mouseover',function(e){
                popUpContent(e.target.feature.properties.ADM2_CODE);
            });
            layer.on('mouseout',function(e){
                popUpContent("");
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
        byRegion_id.filter(id);
        countByRegion2.all().forEach(function(e){
            if(e.value>0){
                html+=e.key+": </h4>";
            } 
        });
        countByOrg2.all().forEach(function(e){
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

        byRegion_id.filterAll();
        byRegion.filterAll();
        if($("#regionDD").val()!="All"){
            byRegion.filter($("#regionDD").val());
        }
    }
    
    $("#popup").html(html);
}

var cf = crossfilter(data);
var bySector = cf.dimension(function(d){return d.sector;});
var countBySector = bySector.group();

createDropDown("#sector_filter","domainDD","Axes d'interventions",countBySector.all());

$("#domainDD").change(function() {
    if($(this).val()=="All"){
        bySector.filterAll();
    } else {
        bySector.filterAll();
        bySector.filter($(this).val());
    }
    populateTable(byActivity.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();
});

var byActivity = cf.dimension(function(d){return d.activity_type.substring(0, 40);});
var countByActivity = byActivity.group();

createDropDown("#activity_filter","activityDD","Activité",countByActivity.all());

$("#activityDD").change(function() {
    if($(this).val()=="All"){
        byActivity.filterAll();
    } else {
        byActivity.filterAll();
        byActivity.filter($(this).val());
    }
    populateTable(byRegion.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();
});

var byRegion = cf.dimension(function(d){return d.region;});
var countByRegion = byRegion.group();

var byRegion2 = cf.dimension(function(d){return d.region;});
var countByRegion2 = byRegion.group();

createDropDown("#region_filter","regionDD","Préfecture",countByRegion.all());

$("#regionDD").change(function() {
    if($(this).val()=="All"){
        byRegion.filterAll();
        byRegion_id.filterAll();
    } else {
        byRegion.filterAll();
        byRegion_id.filterAll();
        byRegion.filter($(this).val());
    }
    populateTable(byActivity.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();
});

var byOrg = cf.dimension(function(d){return d.org;});
var countByOrg = byOrg.group();
var byOrg2 = cf.dimension(function(d){return d.org;});
var countByOrg2 = byOrg2.group();

createDropDown("#org_filter","orgDD","Organisation",countByOrg.all());

$("#orgDD").change(function() {
    if($(this).val()=="All"){
        byOrg.filterAll();
    } else {
        byOrg.filterAll();
        byOrg.filter($(this).val());
    }
    populateTable(byRegion.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();
});

$("#reset").on("click",function(){
    byOrg.filterAll();
    byRegion.filterAll();
    byRegion_id.filterAll();
    bySector.filterAll();
    byActivity.filterAll();
    $("#orgDD").val("All");
    $("#activityDD").val("All");
    $("#regionDD").val("All");
    $("#domainDD").val("All");
    populateTable(byActivity.bottom(Infinity));
    updateMap(countByRegion_id.all());
    reduceAllFilters();    
});

var byRegion_id = cf.dimension(function(d){return d.region_id;});
var byRegion_id2 = cf.dimension(function(d){return d.region_id;});
var countByRegion_id = byRegion_id2.group();

populateTable(byActivity.bottom(Infinity));
initMap();
updateMap(countByRegion_id.all());