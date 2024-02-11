var dbPass = "Passw0rd"
var clusterName = "testCluster"

try {
  print('Setting up InnoDB cluster...\n');
  dba.configureInstance('icadmin@mysqlnode02:3306',{password:dbPass,interactive:false,restart:true});
  shell.connect('icadmin@mysqlnode01:3306', dbPass);
  print('Adding instances to the cluster.');
  dba.getCluster().rescan();
  dba.getCluster().addInstance({user: "icadmin", host: "mysqlnode02", port: "3306", password: dbPass}, {recoveryMethod: "clone"});
  print('.\nInstances successfully added to the cluster.');
  print('\nInnoDB cluster deployed successfully.\n');
} catch(e) {
print('\nThe InnoDB cluster could not be created.\n\nError: ' + e.message + '\n');
}
