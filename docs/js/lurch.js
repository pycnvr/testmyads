(function(win, doc) {
    win.lurch = win.lurch || {};

    var checkList = ['launcher.min', 'pubcid', 'pubcode', 'cvl', 'gdpr-cmp-bootstrap'];
    var cbTagPrefix = 'cb_';         // prefix for checkbox id
    var pubcidTag = 'pubcid_here';   // span to show pubcid
    var sidTag = 'test_site_id';
    var lidTag = 'test_launcher_id';
    var defaultSid = 119041;
    var defaultLid = 16;

    var sid;
    var lid;
    var sidBox;
    var lidBox;

    function hasScript(searchString){
        var scripts = document.getElementsByTagName('script');
        for(let i = 0;i < scripts.length; i++){
            const src = scripts[i].src;
            if(src.indexOf(searchString) >= 0) {
                return scripts[i];
            }
        }
    }

    function setStorageItem(key, val) {
        try {
            localStorage.setItem(key, val);
        }
        catch(e) {
            console.error('Failed to set ' + key, e);
        }
    }

    function getStorageItem(key) {
        try {
            return localStorage.getItem(key);
        }
        catch(e) {
            console.error('Failed to get ' + key, e);
        }
    }

    function removeStorageItem(key) {
        try {
            localStorage.remoeItem(key);
        }
        catch(e) {
            console.error('Failed to remove ' + key, e);
        }
    }

    function loadStoredValues() {
        sid = getStorageItem(sidTag);
        lid = getStorageItem(lidTag);
    }

    function onBtnClick() {
        if (sidBox && sidBox.value !== undefined) {
            sid = sidBox.value;
            setStorageItem(sidTag, sid);
        }
        else {
            sid = undefined;
            removeStorageItem(sidTag);
        }

        if (lidBox && lidBox.value !== undefined) {
            lid = lidBox.value;
            setStorageItem(lidTag, lid);
        }
        else {
            lid = undefined;
            removeStorageItem(lidTag);
        }

        win.location.reload();
    }

    lurch.makeInfoSection = function(id, allowSid = true) {
        var parent = doc.getElementById(id);
        if (id) {
            if (allowSid) {
                var label = doc.createElement('label');
                label.innerHTML = 'Site: ';
                parent.appendChild(label);

                sidBox = doc.createElement('input');
                sidBox.type = 'text';
                if (sid != undefined)
                    sidBox.value = sid;

                sidBox.placeholder = defaultSid;
                sidBox.size = 10;
                sidBox.id = sidTag;
                parent.appendChild(sidBox);
            }

            label = doc.createElement('label');
            label.innerHTML= (allowSid ? ' ' : '') + 'Launcher:';
            parent.appendChild(label);

            lidBox = doc.createElement('input');
            lidBox.type = 'text';
            if (lid != undefined)
                lidBox.value = lid;

            lidBox.placeholder = defaultLid;
            lidBox.size = 10;
            lidBox.id = lidTag;
            parent.appendChild(lidBox);

            label = doc.createElement('label');
            label.innerHTML=' ';
            parent.appendChild(label);

            var updateBtn = doc.createElement('input');
            updateBtn.type = 'button';
            updateBtn.value = 'update';
            updateBtn.onclick = onBtnClick;
            parent.appendChild(updateBtn);
        }
    }

    lurch.makeCheckboxes = function(id) {
        var parent = doc.getElementById(id);
        if (id) {
            checkList.forEach((val)=>{
                var label = doc.createElement('label');
                var desc = doc.createTextNode(val);
                var cb = doc.createElement('input');

                cb.type = 'checkbox';
                cb.id = cbTagPrefix + val;
                cb.value = val;
                cb.onclick = ()=>{return false;};

                label.appendChild(cb);
                label.appendChild(desc);
                parent.appendChild(label);
                parent.appendChild(doc.createElement('br'));
            });
        }
    };

    lurch.checkStatus = function() {
        for (let i = 0; i < checkList.length; ++i) {
            var item = hasScript(checkList[i]);

            var box = document.getElementById(cbTagPrefix + checkList[i]);
            if (box)
                box.checked = (item !== undefined) ? true : false;
        }

        var pubcidValue = (typeof PublisherCommonId !== 'undefined') ? PublisherCommonId.getId() : 'None';
        var pubcidNode = document.getElementById(pubcidTag);
        pubcidNode.innerHTML = pubcidValue;

    };

    lurch.watchStatus = function() {
        lurch.checkStatus();
        setInterval(lurch.checkStatus, 1000);
    };

    lurch.getSid = function() {
        return sid || defaultSid;
    }

    lurch.getLid = function() {
        return lid || defaultLid;
    }

    loadStoredValues();


})(window, document);
