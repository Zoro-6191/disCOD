import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Index("alias", ["alias", "client_id"], { unique: true })
@Index("client_id", ["client_id"], {})
@Entity("aliases")
export class Aliases
{
    // `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    @PrimaryGeneratedColumn({ 
        type: "int", 
        name: "id", 
        unsigned: true
    })
    id: number;

    // `num_used` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "num_used", 
        unsigned: true, 
        default: () => "'0'" 
    })
    num_used: number;

    // `alias` VARCHAR(32) NOT NULL DEFAULT '',
    @Column("varchar", { 
        name: "alias", 
        length: 32,
        nullable: false,
        default: ""
    })
    alias: string;

    // `client_id` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "client_id", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    client_id: number;

    // `time_add` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @CreateDateColumn({ 
        type: "timestamp",
        name: "time_add", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    time_add: number;

    // `time_edit` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @UpdateDateColumn({ 
        type: "timestamp",
        name: "time_edit", 
        unsigned: true,
        nullable: false,
        default: () => "'0'" 
    })
    time_edit: number;
}