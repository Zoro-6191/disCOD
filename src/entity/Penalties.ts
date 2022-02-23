import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum PenaltyType 
{
    "Ban",
    "TempBan",
    "Kick",
    "Warning",
    "Notice"
}

@Entity()
export class Penalties extends BaseEntity
{
    // `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    @PrimaryGeneratedColumn({unsigned: true})
    public id!: number;

    // `type` ENUM('Ban','TempBan','Kick','Warning','Notice') NOT NULL DEFAULT 'Ban',
    @Column({
        type: "enum", enum: PenaltyType,
        nullable: false,
        default: "Ban"
    })
    public type!: PenaltyType;

    // `client_id` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column({
        type: "int", length: 10,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public client_id!: number;

    // `admin_id` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column({
        type: "int", length: 10,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public admin_id!: number;

    // `duration` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column({
        type: "int", length: 10,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public duration: Date | number;

    // `inactive` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0',
    @Column({
        type: "tinyint", length: 1,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public inactive!: 1 | 0;

    // `keyword` VARCHAR(16) NOT NULL DEFAULT '',
    @Column({
        type: "varchar", length: 16,
        nullable: false,
        default: ""
    })
    public keyword!: string;

    // `reason` VARCHAR(255) NOT NULL DEFAULT '',
    @Column({
        type: "varchar", length: 255,
        nullable: false,
        default: ""
    })
    public reason!: string

    // `data` VARCHAR(255) NOT NULL DEFAULT '',
    @Column({
        type: "varchar", length: 255,
        nullable: false,
        default: ""
    })
    public data!: string;

    // `time_add` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @CreateDateColumn({
        type: "int", length: 11,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public time_add!: Date | number;

    // `time_edit` INT(11) UNSIGNED NOT NULL DEFAULT '0',
    @UpdateDateColumn({
        type: "int", length: 11,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public time_edit!: Date | number;

    // `time_expire` INT(11) NOT NULL DEFAULT '0',   
    @Column({
        type: "int", length: 11,
        nullable: false,
        default: 0
    })
    public time_expire!: Date | number;
}