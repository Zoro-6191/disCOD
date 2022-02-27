import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn, Unique } from "typeorm";

@Index("guid", ["guid"], { unique: true })
@Index("group_bits", ["groupBits"], {})
@Index("name", ["name"], {})
@Unique(["guid"])
@Entity("clients")
export class Clients extends BaseEntity
{
    // `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    @PrimaryGeneratedColumn({ 
        type: "int", 
        name: "id", 
        unsigned: true 
    })
    id: number;

    // `ip` VARCHAR(16) NOT NULL DEFAULT '',
    @Column("varchar", { 
        name: "ip", 
        length: 16,
        nullable: false,
        default: () => ""
    })
    ip: string;

    // `connections` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "connections", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    connections: number;

    // `guid` VARCHAR(36) NOT NULL UNIQUE DEFAULT '',
    @Column("varchar", { 
        name: "guid", 
        nullable: true, 
        unique: true, 
        length: 36 
    })
    guid: string | null;

    // `pbid` VARCHAR(32) NOT NULL DEFAULT '',
    @Column("varchar", { 
        name: "pbid", 
        length: 32,
        nullable: false,
        default: () => ""
    })
    pbid: string;

    // `name` VARCHAR(32) NOT NULL DEFAULT '',
    @Column("varchar", { 
        name: "name", 
        length: 32,
        nullable: false,
        default: ""
    })
    name: string;

    // `auto_login` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0',
    @Column("tinyint", {
        name: "auto_login",
        unsigned: true,
        nullable: false,
        default: () => "'0'",
    })
    autoLogin: number;

    // `mask_level` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0',
    @Column("tinyint", {
        name: "mask_level",
        unsigned: true,
        default: () => "'0'",
    })
    maskLevel: number;

    // `group_bits` MEDIUMINT(8) UNSIGNED NOT NULL DEFAULT '0',
    @Column("mediumint", {
        name: "group_bits",
        unsigned: true,
        nullable: false,
        default: () => "'0'",
    })
    groupBits: number;

    // `greeting` VARCHAR(128) NOT NULL DEFAULT '',
    @Column("varchar", { 
        name: "greeting", 
        length: 128,
        nullable: false,
        default: ""
    })
    greeting: string;

    // `time_add` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "time_add", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    timeAdd: number;

    // `time_edit` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "time_edit", 
        unsigned: true, 
        default: () => "'0'" 
    })
    timeEdit: number;

    // `password` VARCHAR(32) DEFAULT NULL
    @Column("varchar", { 
        name: "password", 
        nullable: true, 
        length: 32 
    })
    password: string | null;

    // `login` VARCHAR(255) DEFAULT NULL,
    @Column("varchar", { name: "login", nullable: true, length: 255 })
    login: string | null;
}