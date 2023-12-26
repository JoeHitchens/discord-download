log = console.log;
HTMLCollection.prototype.toArray = function() {
    let arr = [];
    for(let i = 0; i < this.length; i++) {
        arr.push( this[ i ]);
    }
    return arr;
};
NodeList.prototype.toArray = HTMLCollection.prototype.toArray;
var chunk = 0;
function download( data ) {
    let keys = Object.keys( data );
    log( "downloading "+(keys.length)+" chats ..." );
    keys.sort( ( a, b ) => { return a < b ? -1 : a > b ? 1 : 0; } )
    let sorted = keys.map( k => {
        return data[ k ];
    } );
    let url = "data:application/json;charset=utf-8," + encodeURIComponent( JSON.stringify( sorted, null, 2 ) );
    let a = document.createElement( "a" );
    a.href = url;
    a.setAttribute( "download", "discord-chats-"+chunk+".json" );
    chunk++;
    document.body.appendChild( a );
    a.click();
    setTimeout( function() {
        a.remove();
        log( "dl removed" );
    }, 5000 );
}
function get_lis() {
    let chats = document.querySelectorAll( "[data-list-id=chat-messages]" )[ 0 ];
    return chats.querySelectorAll( "li" ).toArray();
}
window.data = {};
function go( skip_to_id ) {    // go( "chat-messages-1119881392768163901-1136806512094875669" )
    function crawl() {
        let arr = get_lis();
        let li = null;
        let id = null;
        let new_seen = 0;
        while( arr.length > 0 ) {
            li = arr.pop();
            if( window.kill ) { window.kill = false; return; }
            id = li.id;
            let tel = li.querySelectorAll( "time" ).toArray()[0];
            let stamp = tel ? tel.getAttribute( "datetime" ) : "-";
            let text = li.innerText;
            let d = { id, stamp, text };
            if( data[ id ] === undefined ) {
                new_seen += 1;
                data[ id ] = d;
                let l = Object.keys( data ).length
                log( l+": "+text.replace( /\n/g, " " ).substr( 0, 70 )+"..." );
                //break;
            }
        }
        if( li ) 
            li.scrollIntoView();
        if( new_seen == 0 ) {
            log( "Done" );
            download();
            return;
        }
        setTimeout( crawl, 3000 );
    }
    crawl();
}


function go_old( who ) {
    chunk = 0;
    all = {};
    downloaded = {};
    function extract() {
        item = 1;
        saw_new = 0;
        chats = document.querySelectorAll( "[data-list-id=chat-messages]" )[ 0 ];
        arr = chats.querySelectorAll( "li" );
        len = arr.length;
        for( i = len - 1; i >= 0 ; i-- ) {
            li = arr[ i ];
            id = li.id;
            time = li.querySelectorAll( "time" ).toArray()[0];
            tstr = "-";
            if( time ) {
                tstr = time.getAttribute( "aria-label" );
            }
            if( ! downloaded[ id ] ) {
                if( ! all[ id ] ) {
                    all[ id ] = li.innerText;
                    saw_new += 1;
                    log( item+": "+id+" adding" );
                } else {
                    log( item+": "+id+" (skip)" );
                }
            }
            li.scrollIntoView();
            item++;
        }
        if( saw_new  ) {
            log( tstr + ": msgs "+saw_new );
            if( JSON.stringify( all, null, 2 ).length > 20000 ) {
                download();
            }
            setTimeout( extract, 2000 );
        } else {
            log( "end!" );
            download();
        }
    }
    extract();
    function download() {
        chunk += 1;
        log( "downloading chunk "+chunk );
        keys = Object.keys( all );
        keys.sort( ( a, b ) => { return a < b ? -1 : a > b ? 1 : 0; } )
        sorted = keys.map( k => {
            return { id: k, text: all[ k ] };
        } );
        url = "data:application/json;charset=utf-8," + JSON.stringify( sorted, null, 2 );
        a = document.createElement( "a" );
        a.href = url;
        a.setAttribute( "download", "discord-chats-"+who+"-"+chunk+".json" );
        document.body.appendChild( a );
        a.click();
        a.remove();
        for(let k in all ) {
            downloaded[ k ] = true;
        }
        all = {}
    }

}

