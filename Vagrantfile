MACHINES = {
  :monitoring => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.250", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
  :mysqlnode01 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.21", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
  :mysqlnode02 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.22", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
  :mysqlnode03 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.23", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
  :glusternode01 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.31", 3, "255.255.255.0"],
                     ],
             :disk => "YES",
             :disk_file => "./gdisk1.vdi",
            },
  :glusternode02 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.32", 3, "255.255.255.0"],
                     ],
             :disk => "YES",
             :disk_file => "./gdisk2.vdi",
            },
  :backend01 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.10", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
  :backend02 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.12", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
  :haproxy01 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.100", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
  :haproxy02 => {
             :box_name => "centos/7",
             :net => [
                      ["192.168.56.200", 3, "255.255.255.0"],
                     ],
             :disk => "NO",
            },
}


hosts_file="127.0.0.1\tlocalhost\n"

MACHINES.each do |hostname,config|  
  config[:net].each do |ip|
      hosts_file=hosts_file+ip[0]+"\t"+hostname.to_s+"\n"
  end
end

Vagrant.configure("2") do |config|
  MACHINES.each do |boxname, boxconfig|
    config.vm.define boxname do |box|
        box.vm.box = boxconfig[:box_name]
        box.vm.host_name = boxname.to_s
        boxconfig[:net].each do |ipconf|
          box.vm.network("private_network", ip: ipconf[0], adapter: ipconf[1], netmask: ipconf[2])
        end
        box.vm.synced_folder '.', '/vagrant', disabled: true
        box.vm.provider "virtualbox" do |v|
          v.memory = 4096
          v.cpus = 2
          if boxconfig[:disk]=="YES"
            if not File.exists?(boxconfig[:disk_file])
              v.customize ['createhd', '--filename', boxconfig[:disk_file], '--size', 10 * 1024]
              v.customize ['storagectl', :id, '--name', 'SATA Controller', '--add', 'sata', '--portcount', 2]
            end
            v.customize ['storageattach', :id,  '--storagectl', 'SATA Controller', '--port', 1, '--device', 0, '--type', 'hdd', '--medium', boxconfig[:disk_file]]
          end
        end
        box.vm.provision "shell" do |shell|
          shell.inline = 'echo -e "$1" > /etc/hosts'
          shell.args = [hosts_file]
        end
        box.vm.provision "ansible" do |ansible|
          ansible.playbook = "provision/site.yml"
        end
    end
  end
end

