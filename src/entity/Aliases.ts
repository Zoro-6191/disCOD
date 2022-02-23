import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Aliases extends BaseEntity
{
    // `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    @PrimaryGeneratedColumn({unsigned: true})
    id!: number;

    // `num_used` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column({ 
        type: "int", length: 10,
        nullable: false, 
        unsigned: true, 
        default: 0, 
    })
    num_used!: number;
    
    // `alias` VARCHAR(32) NOT NULL DEFAULT '',
    @Column({
        type: "varchar", length: 32, 
        nullable: false, 
        default: ""
    })
    alias!: string;

    // `client_id` INT(10) UNSIGNED NOT NULL DEFAULT '0',    
    @Column({ 
        type: "int", length: 10,
        unsigned: true ,
        nullable: false, 
        default: 1, 
    })
    client_id!: number;

    // `time_add` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @CreateDateColumn( { 
        type: "int", length: 10, 
        unsigned: true,
        nullable: false,
        default: 0
    } )
    time_add!: Date | number;

    // `time_edit` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @UpdateDateColumn( { 
        type: "int", length: 10, 
        unsigned: true,
        nullable: false,
        default: 0
    })
    time_edit!: Date | number;
}