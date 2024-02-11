# HA Nextcloud Server

Задание:  

В проект должны быть включены:  
— как минимум 2 узла с СУБД;   
— минимум 2 узла с веб-серверами;   
— настройка межсетевого экрана (запрещено всё, что не разрешено);   
— скрипты резервного копирования;   
— центральный сервер сбора логов (Rsyslog/Journald/ELK).  

---

### Запуск

Реализовано в виде ролей ansible.  

Для запуска: 

vagrant up


### Краткое описание 

Используются следующие технологии:
- netdata в качестве централизованного риалтайм мониторинга
- percona PMM для сбора метрик с mysql нод
- rsyslog в качестве централизованного сбора логов со всех хостов (Приоритет 4 - warning (старое название WARN) - Предупреждение.) https://www.k-max.name/linux/syslogd-and-logrotate/
- restic используется для бэкапов на центральный сервер restic — система резервного копирования, предоставляет инструменты для сохранения резервных копий в версионированном репозитории
- haproxy в качестве балансировщика нагрузки и SSL терминирования
- keepalived - это программный комплекс обеспечивающий высокую доступность и балансировку нагрузки.
- nginx и php-fpm на бэкендах
- glusterfs кластер в роли общего сетевого хранилища. GlusterFS это распределённая отказоустойчивая файловая система. Позволяет объединять хранилища, расположенные как на разных серверах в одной сети, так и на разных серверах в рамках глобальной сети Интернет.
- innodb mysql кластер в качестве СУБД кластера. InnoDB – это одна из подсистем низкого уровня в СУБД MySQL, входящая во все стандартные сборки для разных ОС. Основное отличие от прочих подсистем низкого уровня MySQL – это присутствие внешних ключей и механизма транзакций.
- firewalld на каждом хосте
- xfs файловая в glusterfs

### Сервер мониторинга и сбора данных

Для подключения к netdata: 

http://192.168.56.250:19999

Подключение к Percona Monitoring and management (PMM):  

http://192.168.56.250/

(admin:admin, дефолтный пароль не нужно менять, нужно нажимать skip).

На сервере monitoring централизованно собираются логи со всех хостов. Пример: 

[root@monitoring ~]# cat /var/log/mysqlnode03/systemd.log 
Feb  7 14:30:48 mysqlnode03 systemd: mysqld.service failed.


Так же, на этот сервер по расписанию создаются бэкапы файлов: 

[root@monitoring ~]#  ls /srv/restic-repo/
config  data  index  keys  locks  snapshots

### Nextcloud server

Предварительно необходимо прописать в свой /etc/hosts плавающий IP:  
`192.168.56.80 nc.example.org`

После этого можно подключаться по адресу: 

http://nc.example.org

Необходимо добавить в исключения самоподписанный сертификат.  

Учетные данные для аутентификации - admin:Passw0rd!

### Проверка работы кластеров

Проверка работы балансировщиков:  

http://nc.example.org:8080/stats
username: 'stat'
password: 'statpass'

Для того чтобы посмотреть состояние innodb кластера, на оба бэкенда добавляются bash алиасы для пользователя root:   

mysqlsh icadmin@sqlnode1:3306 -- cluster status

[root@backend01 ~]# check-cluster-1
Please provide the password for 'icadmin@mysqlnode01:3306': ********
Save password for 'icadmin@mysqlnode01:3306'? [Y]es/[N]o/Ne[v]er (default No): y
{
    "clusterName": "testCluster", 
    "defaultReplicaSet": {
        "name": "default", 
        "primary": "mysqlnode03:3306", 
        "ssl": "REQUIRED", 
        "status": "OK", 
        "statusText": "Cluster is ONLINE and can tolerate up to ONE failure.", 
        "topology": {
            "mysqlnode01:3306": {
                "address": "mysqlnode01:3306", 
                "memberRole": "SECONDARY", 
                "mode": "R/O", 
                "readReplicas": {}, 
                "replicationLag": "applier_queue_applied", 
                "role": "HA", 
                "status": "ONLINE", 
                "version": "8.0.36"
            }, 
            "mysqlnode02:3306": {
                "address": "mysqlnode02:3306", 
                "memberRole": "SECONDARY", 
                "mode": "R/O", 
                "readReplicas": {}, 
                "replicationLag": "applier_queue_applied", 
                "role": "HA", 
                "status": "ONLINE", 
                "version": "8.0.36"
            }, 
            "mysqlnode03:3306": {
                "address": "mysqlnode03:3306", 
                "memberRole": "PRIMARY", 
                "mode": "R/W", 
                "readReplicas": {}, 
                "replicationLag": "applier_queue_applied", 
                "role": "HA", 
                "status": "ONLINE", 
                "version": "8.0.36"
            }
        }, 
        "topologyMode": "Single-Primary"
    }, 
    "groupInformationSourceMember": "mysqlnode03:3306"
}


(пароль на innodb кластер Passw0rd)


Посмотреть состояние glusterfs кластера: 


[root@glnode1 ~]# gluster peer status
Number of Peers: 1

Hostname: glnode2
Uuid: 78abf40e-f427-42d5-bcdb-6099521a6f16
State: Peer in Cluster (Connected)[root@glusternode01 ~]# gluster peer status
Number of Peers: 1

Hostname: glusternode02
Uuid: 4cbeaff0-07c0-4b9a-96e6-28bc031dffbf
State: Peer in Cluster (Connected)

[root@glusternode01 ~]# gluster vol status
Status of volume: gv0
Gluster process                             TCP Port  RDMA Port  Online  Pid
------------------------------------------------------------------------------
Brick glusternode01:/srv/gluster/brick/gv0  49152     0          Y       31837
Brick glusternode02:/srv/gluster/brick/gv0  49152     0          Y       9313 
Self-heal Daemon on localhost               N/A       N/A        Y       31855
Self-heal Daemon on glusternode02           N/A       N/A        Y       9330 
 
Task Status of Volume gv0
------------------------------------------------------------------------------
There are no active volume tasks


### restic бэкапы

Для того чтобы запустить создание бэкапа вручную: 

[root@backend01 ~]# restic-nextcloud backup /var/gluster/www/nextcloud
repository b3001953 opened successfully, password is correct
created new cache in /root/.cache/restic

Files:       14926 new,     0 changed,     0 unmodified
Dirs:            3 new,     0 changed,     0 unmodified
Added to the repo: 227.889 MiB

processed 14926 files, 242.859 MiB in 1:01
snapshot f02af495 saved

[root@backend1 ~]# restic-nextcloud list snapshots
repository b3001953 opened successfully, password is correct
f02af495d43294610dfb8372406df8fc2715f60fbe551896b6218310c0ff77e3

[root@backend1 ~]# [root@backend01 ~]# restic-nextcloud list snapshots
subprocess ssh: Warning: Permanently added 'monitoring,192.168.56.250' (ECDSA) to the list of known hosts.
repository 4ab0d141 opened successfully, password is correct
ecd484471b3dbed87089a3ec42fd40542b8f8066a2dccf5a721716a27b9777f7


```
restic-nextcloud restore latest --target /


# Remove dead server
gluster volume remove-brick myvolume replica 3 10.0.0.5:/glusterfs/distributed force
gluster peer detach 10.0.0.5
# add peer again
gluster peer probe 10.0.0.5
gluster volume add-brick myvolume replica 4 10.0.0.5:/glusterfs/distributed force