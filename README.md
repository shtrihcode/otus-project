# HA Project Nextcloud Server

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

```console
vagrant up
```
Время развертывания ~ 1 час. 

### Краткое описание 

Используются следующие технологии:
- netdata в качестве централизованного риалтайм мониторинга
- percona PMM для сбора метрик с mysql нод
- rsyslog в качестве централизованного сбора логов со всех хостов
- restic используется для бэкапов на центральный сервер
- haproxy в качестве балансировщика нагрузки и SSL терминирования
- keepalived
- nginx и php-fpm на бэкендах
- glusterfs кластер в роли общего сетевого хранилища
- innodb mysql кластер в качестве СУБД кластера
- firewalld на каждом хосте

### Сервер мониторинга и сбора данных

Для подключения к netdata: 

http://192.168.56.250:19999

(для сокращения времени деплоя по дефолту netdata slave ставится только на ноды glusterfs кластера, остальные закомментированы в файле provision/site.yml).  

Подключение к Percona Monitoring and management (PMM):  

http://192.168.56.250/

(admin:admin, дефолтный пароль не нужно менять, нужно нажимать skip).

На сервере **mon** централизованно собираются логи со всех хостов. Пример: 

```console
[root@mon ~]# cat /var/log/sqlnode3/systemd.log 
Jan 24 16:26:45 sqlnode3 systemd: mysqld.service failed.
```

Так же, на этот сервер по расписанию создаются бэкапы файлов: 

```console
[root@mon ~]# ls /srv/restic-repo/
config  data  index  keys  locks  snapshots
```

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

```console
mysqlsh icadmin@sqlnode1:3306 -- cluster status

[root@backend1 ~]# check-cluster 
Please provide the password for 'icadmin@sqlnode1:3306': ********
{
    "clusterName": "testCluster", 
    "defaultReplicaSet": {
        "name": "default", 
        "primary": "sqlnode1:3306", 
        "ssl": "REQUIRED", 
        "status": "OK", 
        "statusText": "Cluster is ONLINE and can tolerate up to ONE failure.", 
        "topology": {
            "sqlnode1:3306": {
                "address": "sqlnode1:3306", 
                "mode": "R/W", 
                "readReplicas": {}, 
                "replicationLag": null, 
                "role": "HA", 
                "status": "ONLINE", 
                "version": "8.0.19"
            }, 
            "sqlnode2:3306": {
                "address": "sqlnode2:3306", 
                "mode": "R/O", 
                "readReplicas": {}, 
                "replicationLag": null, 
                "role": "HA", 
                "status": "ONLINE", 
                "version": "8.0.19"
            }, 
            "sqlnode3:3306": {
                "address": "sqlnode3:3306", 
                "mode": "R/O", 
                "readReplicas": {}, 
                "replicationLag": null, 
                "role": "HA", 
                "status": "ONLINE", 
                "version": "8.0.19"
            }
        }, 
        "topologyMode": "Single-Primary"
    }, 
    "groupInformationSourceMember": "sqlnode1:3306"
}

```

(пароль на innodb кластер Passw0rd)


Посмотреть состояние glusterfs кластера: 

```console
[root@glnode1 ~]# gluster peer status
Number of Peers: 1

Hostname: glnode2
Uuid: 78abf40e-f427-42d5-bcdb-6099521a6f16
State: Peer in Cluster (Connected)
[root@glnode1 ~]# 
[root@glnode1 ~]# gluster vol status
Status of volume: gv0
Gluster process                             TCP Port  RDMA Port  Online  Pid
------------------------------------------------------------------------------
Brick glnode1:/srv/gluster/brick/gv0        49152     0          Y       21416
Brick glnode2:/srv/gluster/brick/gv0        49152     0          Y       21841
Self-heal Daemon on localhost               N/A       N/A        Y       21437
Self-heal Daemon on glnode2                 N/A       N/A        Y       21862
 
Task Status of Volume gv0
------------------------------------------------------------------------------
There are no active volume tasks

```


### restic бэкапы

Для того чтобы запустить создание бэкапа вручную: 

```console
[root@backend1 ~]# restic-nextcloud backup /var/gluster/www/nextcloud
repository b3001953 opened successfully, password is correct
created new cache in /root/.cache/restic

Files:       14926 new,     0 changed,     0 unmodified
Dirs:            3 new,     0 changed,     0 unmodified
Added to the repo: 227.889 MiB

processed 14926 files, 242.859 MiB in 1:01
snapshot f02af495 saved
[root@backend1 ~]# 
[root@backend1 ~]# restic-nextcloud list snapshots
repository b3001953 opened successfully, password is correct
f02af495d43294610dfb8372406df8fc2715f60fbe551896b6218310c0ff77e3
[root@backend1 ~]# 

```

