(defrule physical_distress_rule
    (User_has_area (item_id ?user) (area ?area))
    (CityArea_has_noise_pollution (item_id ?area) (noise_pollution ?noise_pollution))
=>
    (bind ?distress_level 0)

    (if (>= ?noise_pollution 45) then (bind ?distress_level (+ ?distress_level 1)))
    (if (>= ?noise_pollution 55) then (bind ?distress_level (+ ?distress_level 1)))
    (if (>= ?noise_pollution 65) then (bind ?distress_level (+ ?distress_level 1)))

    (if (and (>= ?distress_level 0) (<= ?distress_level 1)) then (add_data ?user (create$ physical_distress) (create$ "Low")))
    (if (and (>= ?distress_level 2) (<= ?distress_level 3)) then (add_data ?user (create$ physical_distress) (create$ "Medium")))
    (if (>= ?distress_level 4) then (add_data ?user (create$ physical_distress) (create$ "High")))
)