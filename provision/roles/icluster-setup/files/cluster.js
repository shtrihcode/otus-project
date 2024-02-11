var dbPass = "Passw0rd"
var clusterName = "testCluster"

try {
  print('Setting up InnoDB cluster...\n');
  dba.configureInstance('icadmin@mysqlnode01:3306',{password:dbPass,interactive:false,restart:true});
  dba.configureInstance('icadmin@mysqlnode02:3306',{password:dbPass,interactive:false,restart:true});
  dba.configureInstance('icadmin@mysqlnode03:3306',{password:dbPass,interactive:false,restart:true});
  shell.connect('icadmin@mysqlnode01:3306', dbPass);
  var cluster = dba.createCluster(clusterName);
  dba.configureInstance();
  print('Adding instances to the cluster.');
  cluster.addInstance({user: "icadmin", host: "mysqlnode02", port: "3306", password: dbPass}, {recoveryMethod: "clone"})
  print('.');
  cluster.addInstance({user: "icadmin", host: "mysqlnode03", port: "3306", password: dbPass}, {recoveryMethod: "clone"})
  print('.\nInstances successfully added to the cluster.');
  print('\nInnoDB cluster deployed successfully.\n');
} catch(e) {
print('\nThe InnoDB cluster could not be created.\n\nError: ' + e.message + '\n');
}
