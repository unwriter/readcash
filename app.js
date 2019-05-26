var global_locale = localStorage.getItem("locale")
global_locale = (global_locale ? global_locale : "US");
var global_currency = getCurrency(global_locale)
var current_currency = currency_display(global_locale)
// ADD API
var add = function(addr, label) {
  var snapshot = localStorage.getItem("snapshot")
  if (snapshot) {
    var last = JSON.parse(snapshot)
    balance(addr, label).then(function(item) {
      item.label = label
      last.items.push(item)
      last.timestamp = Date.now()
      localStorage.setItem("snapshot", JSON.stringify(last))
      window.location.href = window.location.href.split("#")[0]
    })
  } else {
    balance(addr, label).then(function(item) {
      item.label = label
      localStorage.setItem("snapshot", JSON.stringify({
        items: [item],
        timestamp: Date.now()
      }))
      window.location.href = window.location.href.split("#")[0]
    })
  }
}
document.addEventListener("DOMContentLoaded", function(e) {
  var host = "https://api.bitindex.network"
  var tablesource   = document.getElementById("table-template").innerHTML;
  var tabletemplate = Handlebars.compile(tablesource);
  var fundsource   = document.getElementById("fund-template").innerHTML;
  var fundtemplate = Handlebars.compile(fundsource);
  var settingssource   = document.getElementById("settings-template").innerHTML;
  var settingstemplate = Handlebars.compile(settingssource);
  var snapshot = localStorage.getItem("snapshot")
  document.querySelector("#settings").innerHTML = "<i class='fas fa-angle-down'></i> " + current_currency;
  document.addEventListener("click", function(e) {
    if (isClickable(e.target.closest("#api"))) {
      document.querySelector(".api").classList.remove("hidden")
      e.preventDefault();
      e.stopPropagation();
    } else if (isClickable(e.target.closest("#settings"))) {
      var html = settingstemplate({
        currencies: currencies
      })
      document.querySelector(".settings .currency-selectors").innerHTML = html;
      document.querySelector(".settings").classList.remove("hidden");
      e.preventDefault();
      e.stopPropagation();
    } else if (isClickable(e.target.closest(".select-currency"))) {
      var selected = e.target.closest(".select-currency");
      var locale = selected.dataset.locale;
      localStorage.setItem("locale", locale)
      e.preventDefault();
      e.stopPropagation();
      window.location.reload()
    } else if (isClickable(e.target.closest("#add"))) {
      var addr = document.querySelector(".address-input").value;
      var label = document.querySelector(".address-label").value;
      add(addr, label)
      e.preventDefault();
      e.stopPropagation();
    } else if (isClickable(e.target.closest(".remove"))) {
      var walletItem = e.target.closest(".wallet-item");
      var remove_addr = walletItem.dataset.addr;
      var snapshot = localStorage.getItem("snapshot")
      if (snapshot) {
        var last = JSON.parse(snapshot)
        for(var i=0; i<last.items.length; i++) {
          if (last.items[i].addr === remove_addr) {
            last.items.splice(i, 1)
            localStorage.setItem("snapshot", JSON.stringify({
              items: last.items,
              timestamp: Date.now()
            }))
            break;
          }
        }
        window.location.reload()
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (isClickable(e.target.closest(".wallet-link"))) {
      var walletItem = e.target.closest(".wallet-item");
      if (walletItem.classList.contains("selected")) {
        walletItem.classList.remove("selected");
        var infoItem = walletItem.querySelector(".info");
        infoItem.innerHTML = "";
      } else {
        walletItem.classList.add("selected");
        var infoItem = walletItem.querySelector(".info");
        var addr = walletItem.dataset.addr;
        var res = fundtemplate({
          host: host,
          addr: addr,
          qr: qr(addr)
        })
        infoItem.innerHTML = res;
      }
      e.preventDefault();
      e.stopPropagation();
    }
  })
  if (snapshot) {
    var last = JSON.parse(snapshot)
    rate(global_currency).then(function(r) {
      Promise.all(last.items.map(function(item) {
        return balance(item.addr, item.label)
      }))
      .then(function(results) {
        var store = {
          items: results
        };
        var total = results.reduce(function(acc, item) {
          return acc + item.val
        }, 0)
        var res = tabletemplate({
          host: host,
          converted: convert(total, r),
          total: comma(total) + " sats (" + (total/100000000) + " BSV)",
          items: results.map(function(result) {
            // find the row by address from the last snapshot
            // get the val and subtract from current
            var delta = 0;
            var converted_delta = 0;
            var type = "";
            for(var i=0; i<last.items.length; i++) {
              if (last.items[i].addr === result.addr) {
                delta = result.val - last.items[i].val;
                if (delta > 0) {
                  converted_delta = convert(delta, r);
                  delta = "<i class='fas fa-arrow-up'></i> " + delta;
                  converted_delta = "<i class='fas fa-arrow-up'></i> " + converted_delta;
                  type = 'up';
                } else if (delta < 0) {
                  converted_delta = convert(delta, r);
                  delta = "<i class='fas fa-arrow-down'></i> " + delta;
                  converted_delta = "<i class='fas fa-arrow-down'></i> " + converted_delta;
                  type = 'down';
                }
                break;
              }
            }
            return {
              addr: result.addr,
              label: result.label,
              val: comma(result.val),
              type: type,
              delta: (delta === 0 ? "" : delta ),
              converted: convert(result.val, r),
              converted_delta: (converted_delta === 0 ? "" : converted_delta ),
            }
          })
        })
        var d = jsondiffpatch.diff(last.items, store.items)
        if (d) {
          last = store;
          last.timestamp = Date.now()
          localStorage.setItem("snapshot", JSON.stringify(last))
        }
        document.body.querySelector(".balance").innerHTML = res;
      })
    })
  } else {
    var res = tabletemplate({
      host: host,
      converted: convert(0, 1.0),
      total: "0 BSV",
      items: []
    })
    document.body.querySelector(".balance").innerHTML = res;
  }

  var addrs = JSON.parse(localStorage.getItem("snapshot"))["items"]
  var amount = (10.0 / addrs.length).toPrecision(3)
  var outputs = addrs.map(function(i) {
    return { address: i.addr, amount: amount.toString(), currency: "USD" }
  })

  moneyButton.render(document.getElementById('money-button-top-up'), {
    outputs: outputs,
    label: "Top Up",
    onError: function(arg) { console.log('onError', arg) }
  })
})
