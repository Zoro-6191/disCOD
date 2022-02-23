import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Clients extends BaseEntity
{
    // `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    @PrimaryGeneratedColumn({ unsigned: true })
    id!: number;

    // `ip` VARCHAR(16) NOT NULL DEFAULT '',
    @Column({ 
        type: "varchar", length: 16,
        nullable: false,
        default: ""
    })
    ip!: string;

    // `connections` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @Column( { 
        type: "int", length: 11, 
        unsigned: true,
        nullable: false, 
        default: 0, 
    } )
    connections!: number;

    // `guid` VARCHAR(36) NOT NULL DEFAULT '',
    @Column( { 
        type: "varchar", length: 36,
        unique: true,
        nullable: false, 
        default: "" 
    } )
    guid!: string;

    // `pbid` VARCHAR(32) NOT NULL DEFAULT '',
    @Column( { 
        type: "varchar", length: 32,
        nullable: false, 
        default: "" 
    } )
    pbid!: string;

    // `name` VARCHAR(32) NOT NULL DEFAULT '',
    @Column( { 
        type: "varchar", length: 32,
        nullable: false, 
        default: "" 
    } )
    name!: string;

    // `auto_login` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0',
    @Column( { 
        type: "tinyint", length: 1, 
        unsigned: true,
        nullable: false, 
        default: 0, 
    } )
    auto_login!: 1 | 0;
    
    // `mask_level` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0',
    @Column( {
        type: "tinyint", length: 1, 
        unsigned: true,
        nullable: false, 
        default: 0
    } )
    mask_level!: number;
    
    // `group_bits` MEDIUMINT(8) UNSIGNED NOT NULL DEFAULT '0',
    @Column( { 
        type: "mediumint", length: 8,
        unsigned: true,
        nullable: false, 
        default: 0
    } )
    group_bits!: number;
    
    // `greeting` VARCHAR(128) NOT NULL DEFAULT '',
    @Column( { 
        type: "varchar", length: 128,
        nullable: false, 
        default: "" 
    } )
    greeting!: string;
    
    // `time_add` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @CreateDateColumn( { 
        type: "int", length: 11,
        unsigned: true, 
        nullable: false,
        default: 0
    } )
    time_add!: Date | number;
    
    // `time_edit` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @UpdateDateColumn( { 
        type: "int", length: 11,
        unsigned: true,
        nullable: false,
        default: 0
    } )
    time_edit!: Date | number;
    
    // `password` VARCHAR(32) DEFAULT NULL,
    @Column( { 
        type: "varchar", length: 32, 
        default: null 
    } )
    password!: string | null;
    
    // `login` VARCHAR(255) DEFAULT NULL,
    @Column( { 
        type: "varchar", length: 255, 
        default: null 
    })
    login!: string | null;
}