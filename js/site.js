function createDropDown(id,filterid,title,list){
    var html="<h5>"+title+"</h5><select id='"+filterid+"'><option selected>All</option>";
    list.forEach(function(e){
        html += "<option>" + e.key + "</option>";
    });
    html+="</select>";
    $(id).html(html);
}

function populateTable(list){
    var html = "<table><tr><th>Region</th><th>Domain</th></tr>";
    list.forEach(function(e){
        html += "<tr><td>" + e.region + "</td><td>" + e.sector + "</td></tr>";
    });
    html +="</table>";
    $("#information_table").html(html);
}

var cf = crossfilter(data);
var bySector = cf.dimension(function(d){return d.sector;});
var countBySector = bySector.group();

createDropDown("#sector_filter","domainDD","Domain",countBySector.all());

$("#domainDD").change(function() {
    console.log($(this).val());
    if($(this).val()=="All"){
        bySector.filterAll();
    } else {
        bySector.filterAll();
        bySector.filter($(this).val());
    }
    populateTable(bySector.bottom(Infinity));
});

var byRegion = cf.dimension(function(d){return d.region;});
var countByRegion = byRegion.group();

createDropDown("#region_filter","regionDD","Region",countByRegion.all());

$("#regionDD").change(function() {
    console.log($(this).val());
    if($(this).val()=="All"){
        byRegion.filterAll();
    } else {
        byRegion.filterAll();
        byRegion.filter($(this).val());
    }
    populateTable(byRegion.bottom(Infinity));
});

var byOrg = cf.dimension(function(d){return d.org;});

//var cf = crossfilter(data);
//var byActivity = cf.dimension(function(d){return d.activity_type;});
//var countByActivity = byActivity.group();

//createDropDown("#activity_filter","Activity",countByActivity.all());

populateTable(byRegion.bottom(Infinity));