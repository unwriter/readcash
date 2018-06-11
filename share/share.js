var global_locale = localStorage.getItem("locale")
global_locale = (global_locale ? global_locale : "US");
var global_currency = getCurrency(global_locale)
var current_currency = currency_display(global_locale)
var select = function(walletItem, template) {
  walletItem.classList.add("selected");
  var infoItem = walletItem.querySelector(".info");
  var addr = walletItem.dataset.addr;
  var res = template({
    addr: addr,
    cashAddr: bchaddr.toCashAddress(addr),
    legacyAddr: bchaddr.toLegacyAddress(addr),
    qr: qr(bchaddr.toCashAddress(addr))
  })
  infoItem.innerHTML = res;
}
document.addEventListener("DOMContentLoaded", function(e) {
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
    } else if (isClickable(e.target.closest(".wallet-link"))) {
      var walletItem = e.target.closest(".wallet-item");
      if (walletItem.classList.contains("selected")) {
        walletItem.classList.remove("selected");
        var infoItem = walletItem.querySelector(".info");
        infoItem.innerHTML = "";
      } else {
        select(walletItem, fundtemplate)
      }
      e.preventDefault();
      e.stopPropagation();
    }
  })

  if (window.location.hash.length > 1) {
    var param = window.location.hash.substring(1)
    var addresses = param.split(',').filter(function(a) {
      return a && a.length > 0;
    })
    if (addresses.length > 0) {
      rate(global_currency).then(function(r) {
        Promise.all(addresses.map(function(addr) {
          return balance(addr)
        }))
        .then(function(results) {
          var store = {
            items: results
          };
          var total = results.reduce(function(acc, item) {
            return acc + item.val
          }, 0)
          var res = tabletemplate({
            converted: convert(total, r),
            total: comma(total) + " sats (" + (total/100000000) + " BCH)",
            items: results.map(function(result) {
              return {
                addr: bchaddr.toCashAddress(result.addr).split(":")[1],
                val: comma(result.val),
                converted: convert(result.val, r)
              }
            })
          })
          document.body.querySelector(".balance").innerHTML = res;
          select(document.querySelector(".wallet-item"), fundtemplate)
        })
      })
    } else {
      window.location.href = window.location.origin
    }
  } else {
    window.location.href = window.location.origin
  }
})
