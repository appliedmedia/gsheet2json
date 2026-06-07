/**
 * Screenshot seeding helpers for Marketplace listing capture.
 *
 * NOT shipped: not included in tsconfig.json's `files`, not copied by the
 * build script, not pushed by clasp. Paste this file into the Apps Script
 * editor temporarily, run screenshotSeed() once, capture screenshots per
 * docs/screenshot_plan.md, then delete the file from the editor before the
 * next clasp push.
 *
 * resetOnboarding() forces the onboarding overlay back on by wiping the
 * UserProperties flag — used to capture screenshot 5.
 */

function screenshotSeed() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.insertSheet('demo_' + new Date().getTime());
  var data = [
    ['Region', 'Product',    'Units', 'Unit Price', 'Revenue',            'In Stock'],
    ['North',  'Widget A',   120,     19.99,        '=C2*D2',             true],
    ['North',  'Widget B',   85,      29.99,        '=C3*D3',             true],
    ['South',  'Widget A',   64,      19.99,        '=C4*D4',             false],
    ['South',  'Widget C',   40,      49.99,        '=C5*D5',             true],
    ['East',   'Widget B',   110,     29.99,        '=C6*D6',             true],
    ['East',   'Widget C',   22,      49.99,        '=C7*D7',             false],
    ['West',   'Widget A',   95,      19.99,        '=C8*D8',             true],
    ['West',   'Widget B',   73,      29.99,        '=C9*D9',             true],
    ['West',   'Widget C',   30,      49.99,        '=C10*D10',           false],
    ['',       'TOTAL',      '=SUM(C2:C10)', '',    '=SUM(E2:E10)',       '']
  ];
  sh.getRange(1, 1, data.length, data[0].length).setValues(data);
  var header = sh.getRange(1, 1, 1, 6);
  header.setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  for (var r = 2; r <= 10; r += 2) {
    sh.getRange(r, 1, 1, 6).setBackground('#f1f3f4');
  }
  sh.getRange('E2:E11').setNumberFormat('$#,##0.00');
  sh.getRange('D2:D11').setNumberFormat('$#,##0.00');
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['North', 'South', 'East', 'West'], true)
    .setAllowInvalid(false).build();
  sh.getRange('A2:A10').setDataValidation(rule);
  sh.setColumnWidths(1, 6, 120);
  sh.setFrozenRows(1);
  SpreadsheetApp.setActiveSheet(sh);
}

function resetOnboarding() {
  PropertiesService.getUserProperties().deleteAllProperties();
}
