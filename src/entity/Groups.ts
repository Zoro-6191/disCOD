import { BaseEntity, Column, CreateDateColumn, Entity, UpdateDateColumn } from "typeorm";


@Entity()
export class Groups extends BaseEntity
{
    // id = bits in b3 for some reason
    // `id` INT(10) UNSIGNED NOT NULL,
    @Column({
        type: "int", length: 10,
        unsigned: true,
        nullable: false
    })
    public id!: number;

    // `name` VARCHAR(32) NOT NULL DEFAULT '',
    @Column({
        type: "varchar", length: 32,
        nullable: false, 
        default: ""
    })
    public name!: string;
    
    // `keyword` VARCHAR(32) NOT NULL DEFAULT '',
    @Column({
        type: "varchar", length: 32,
        nullable: false, 
        default: ""
    })
    public keyword!: string;
    
    // `level` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column({
        type: "int", length: 10,
        unsigned: true,
        nullable: false, 
        default: 0
    })
    public level!: number;

    // `time_edit` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @CreateDateColumn({
        type: "int", length: 10,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public time_edit!: Date | number;

    // `time_add` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @UpdateDateColumn({
        type: "int", length: 10,
        unsigned: true,
        nullable: false,
        default: 0
    })
    public time_add!: Date | number;
}