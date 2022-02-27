import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("alias", ["alias", "clientId"], { unique: true })
@Index("client_id", ["clientId"], {})
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
    numUsed: number;

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
    clientId: number;

    // `time_add` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "time_add", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    timeAdd: number;

    // `time_edit` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    @Column("int", { 
        name: "time_edit", 
        unsigned: true, 
        nullable: false,
        default: () => "'0'" 
    })
    timeEdit: number;
}