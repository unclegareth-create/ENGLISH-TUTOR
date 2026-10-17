(module
  (memory (export "memory") 4)

  ;; Fast Xorshift32 PRNG returning normalized float in [-1.0, 1.0]
  (func $rand_sym (result f32)
    (local $s i32)
    (local.set $s (i32.load (i32.const 24)))
    (if (i32.eqz (local.get $s))
      (then (local.set $s (i32.const 2463534242)))
    )
    (local.set $s (i32.xor (local.get $s) (i32.shl (local.get $s) (i32.const 13))))
    (local.set $s (i32.xor (local.get $s) (i32.shr_u (local.get $s) (i32.const 17))))
    (local.set $s (i32.xor (local.get $s) (i32.shl (local.get $s) (i32.const 5))))
    (i32.store (i32.const 24) (local.get $s))
    (f32.sub
      (f32.mul
        (f32.convert_i32_u (i32.and (local.get $s) (i32.const 65535)))
        (f32.const 0.000030518043793392844)
      )
      (f32.const 1.0)
    )
  )

  ;; Fast PRNG in [0.0, 1.0]
  (func $rand_unit (result f32)
    (f32.mul
      (f32.add (call $rand_sym) (f32.const 1.0))
      (f32.const 0.5)
    )
  )

  (func (export "get_particles_ptr") (result i32)
    (i32.const 64)
  )

  (func (export "get_metrics_ptr") (result i32)
    (i32.const 0)
  )

  ;; init_sim(mode: i32, count: i32, seed: i32)
  (func (export "init_sim") (param $mode i32) (param $count i32) (param $seed i32)
    (local $i i32)
    (local $ptr i32)
    (local $rx f32)
    (local $ry f32)
    (local $r f32)

    (if (i32.gt_s (local.get $count) (i32.const 4096))
      (then (local.set $count (i32.const 4096)))
    )
    (if (i32.lt_s (local.get $count) (i32.const 64))
      (then (local.set $count (i32.const 64)))
    )

    (i32.store (i32.const 16) (local.get $mode))
    (i32.store (i32.const 20) (local.get $count))
    (i32.store (i32.const 24) (local.get $seed))
    (f32.store (i32.const 0) (f32.const 0.25))
    (f32.store (i32.const 4) (f32.const 0.0))
    (f32.store (i32.const 28) (f32.const 1.0))

    (local.set $i (i32.const 0))
    (block $break
      (loop $top
        (br_if $break (i32.ge_s (local.get $i) (local.get $count)))
        (local.set $ptr (i32.add (i32.const 64) (i32.shl (local.get $i) (i32.const 5))))

        (local.set $rx (call $rand_sym))
        (local.set $ry (call $rand_sym))
        (local.set $r (f32.sqrt (f32.add (f32.mul (local.get $rx) (local.get $rx)) (f32.mul (local.get $ry) (local.get $ry)))))
        (if (f32.lt (local.get $r) (f32.const 0.001))
          (then (local.set $r (f32.const 0.5)))
        )

        ;; x, y, z
        (f32.store offset=0 (local.get $ptr) (local.get $rx))
        (f32.store offset=4 (local.get $ptr) (local.get $ry))
        (f32.store offset=8 (local.get $ptr) (f32.add (f32.const 0.25) (f32.mul (call $rand_unit) (f32.const 0.75))))

        ;; vx, vy, vz
        (f32.store offset=12 (local.get $ptr) (f32.mul (f32.neg (local.get $ry)) (f32.const 0.35)))
        (f32.store offset=16 (local.get $ptr) (f32.mul (local.get $rx) (f32.const 0.35)))
        (f32.store offset=20 (local.get $ptr) (call $rand_sym))

        ;; life, energy
        (f32.store offset=24 (local.get $ptr) (call $rand_unit))
        (f32.store offset=28 (local.get $ptr) (f32.add (f32.const 0.4) (f32.mul (call $rand_unit) (f32.const 0.6))))

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $top)
      )
    )
  )

  ;; trigger_burst(bx: f32, by: f32, power: f32, kind: f32)
  (func (export "trigger_burst") (param $bx f32) (param $by f32) (param $power f32) (param $kind f32)
    (local $i i32)
    (local $count i32)
    (local $ptr i32)
    (local $dx f32)
    (local $dy f32)
    (local $dist2 f32)
    (local $invDist f32)
    (local $imp f32)

    (f32.store (i32.const 4) (f32.min (f32.const 2.5) (f32.add (f32.load (i32.const 4)) (local.get $power))))
    (f32.store (i32.const 8) (local.get $bx))
    (f32.store (i32.const 12) (local.get $by))
    (f32.store (i32.const 28) (local.get $kind))

    (local.set $count (i32.load (i32.const 20)))
    (local.set $i (i32.const 0))
    (block $break
      (loop $top
        (br_if $break (i32.ge_s (local.get $i) (local.get $count)))
        (local.set $ptr (i32.add (i32.const 64) (i32.shl (local.get $i) (i32.const 5))))

        (local.set $dx (f32.sub (f32.load offset=0 (local.get $ptr)) (local.get $bx)))
        (local.set $dy (f32.sub (f32.load offset=4 (local.get $ptr)) (local.get $by)))
        (local.set $dist2 (f32.add (f32.const 0.04) (f32.add (f32.mul (local.get $dx) (local.get $dx)) (f32.mul (local.get $dy) (local.get $dy)))))
        (local.set $invDist (f32.div (f32.const 1.0) (f32.sqrt (local.get $dist2))))
        (local.set $imp (f32.div (f32.mul (local.get $power) (f32.const 0.22)) (local.get $dist2)))
        (if (f32.gt (local.get $imp) (f32.const 1.8))
          (then (local.set $imp (f32.const 1.8)))
        )

        ;; Apply radial + tangential impulse
        (f32.store offset=12 (local.get $ptr)
          (f32.add
            (f32.load offset=12 (local.get $ptr))
            (f32.mul (f32.sub (f32.mul (local.get $dx) (local.get $invDist)) (f32.mul (local.get $dy) (f32.const 0.4))) (local.get $imp))
          )
        )
        (f32.store offset=16 (local.get $ptr)
          (f32.add
            (f32.load offset=16 (local.get $ptr))
            (f32.mul (f32.add (f32.mul (local.get $dy) (local.get $invDist)) (f32.mul (local.get $dx) (f32.const 0.4))) (local.get $imp))
          )
        )
        ;; Boost particle energy
        (f32.store offset=28 (local.get $ptr)
          (f32.min (f32.const 2.4) (f32.add (f32.load offset=28 (local.get $ptr)) (f32.mul (local.get $imp) (f32.const 0.65))))
        )

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $top)
      )
    )
  )

  ;; step_sim(dt: f32, time: f32, intensity: f32, ax: f32, ay: f32) -> f32 (returns RMS energy)
  (func (export "step_sim") (param $dt f32) (param $time f32) (param $intensity f32) (param $ax f32) (param $ay f32) (result f32)
    (local $i i32)
    (local $count i32)
    (local $mode i32)
    (local $ptr i32)
    (local $x f32)
    (local $y f32)
    (local $z f32)
    (local $vx f32)
    (local $vy f32)
    (local $vz f32)
    (local $life f32)
    (local $energy f32)
    (local $r f32)
    (local $targetR f32)
    (local $radialF f32)
    (local $swirlF f32)
    (local $dx f32)
    (local $dy f32)
    (local $cdist2 f32)
    (local $sumE f32)
    (local $burstE f32)

    (if (f32.gt (local.get $dt) (f32.const 0.05))
      (then (local.set $dt (f32.const 0.05)))
    )
    (if (f32.lt (local.get $dt) (f32.const 0.001))
      (then (local.set $dt (f32.const 0.016)))
    )

    ;; Decay global burst envelope
    (local.set $burstE (f32.mul (f32.load (i32.const 4)) (f32.const 0.94)))
    (if (f32.lt (local.get $burstE) (f32.const 0.001))
      (then (local.set $burstE (f32.const 0.0)))
    )
    (f32.store (i32.const 4) (local.get $burstE))

    (local.set $mode (i32.load (i32.const 16)))
    (local.set $count (i32.load (i32.const 20)))
    (local.set $sumE (f32.const 0.0))
    (local.set $i (i32.const 0))

    (block $break
      (loop $top
        (br_if $break (i32.ge_s (local.get $i) (local.get $count)))
        (local.set $ptr (i32.add (i32.const 64) (i32.shl (local.get $i) (i32.const 5))))

        (local.set $x (f32.load offset=0 (local.get $ptr)))
        (local.set $y (f32.load offset=4 (local.get $ptr)))
        (local.set $z (f32.load offset=8 (local.get $ptr)))
        (local.set $vx (f32.load offset=12 (local.get $ptr)))
        (local.set $vy (f32.load offset=16 (local.get $ptr)))
        (local.set $vz (f32.load offset=20 (local.get $ptr)))
        (local.set $life (f32.load offset=24 (local.get $ptr)))
        (local.set $energy (f32.load offset=28 (local.get $ptr)))

        ;; Cursor magnetic interaction
        (local.set $dx (f32.sub (local.get $ax) (local.get $x)))
        (local.set $dy (f32.sub (local.get $ay) (local.get $y)))
        (local.set $cdist2 (f32.add (f32.const 0.06) (f32.add (f32.mul (local.get $dx) (local.get $dx)) (f32.mul (local.get $dy) (local.get $dy)))))
        (if (f32.lt (local.get $cdist2) (f32.const 0.35))
          (then
            (local.set $vx (f32.add (local.get $vx) (f32.mul (local.get $dy) (f32.mul (local.get $dt) (f32.const 1.1)))))
            (local.set $vy (f32.sub (local.get $vy) (f32.mul (local.get $dx) (f32.mul (local.get $dt) (f32.const 1.1)))))
            (local.set $energy (f32.min (f32.const 2.2) (f32.add (local.get $energy) (f32.mul (local.get $dt) (f32.const 0.8)))))
          )
        )

        ;; Mode-specific physics kernel
        (if (i32.eq (local.get $mode) (i32.const 0))
          (then
            ;; MODE 0: TOKAMAK PLASMA REACTOR (Lorentz Torus Confinement)
            (local.set $r (f32.sqrt (f32.add (f32.const 0.0004) (f32.add (f32.mul (local.get $x) (local.get $x)) (f32.mul (local.get $y) (local.get $y))))))
            (local.set $targetR (f32.add (f32.const 0.36) (f32.mul (local.get $z) (f32.const 0.28))))
            (local.set $radialF (f32.mul (f32.sub (local.get $targetR) (local.get $r)) (f32.const 2.8)))
            (local.set $swirlF (f32.add (f32.const 1.15) (f32.mul (local.get $intensity) (f32.const 1.65))))

            (local.set $vx
              (f32.add
                (local.get $vx)
                (f32.mul
                  (local.get $dt)
                  (f32.sub
                    (f32.mul (f32.div (local.get $x) (local.get $r)) (local.get $radialF))
                    (f32.mul (f32.div (local.get $y) (local.get $r)) (local.get $swirlF))
                  )
                )
              )
            )
            (local.set $vy
              (f32.add
                (local.get $vy)
                (f32.mul
                  (local.get $dt)
                  (f32.add
                    (f32.mul (f32.div (local.get $y) (local.get $r)) (local.get $radialF))
                    (f32.mul (f32.div (local.get $x) (local.get $r)) (local.get $swirlF))
                  )
                )
              )
            )
            (local.set $vx (f32.mul (local.get $vx) (f32.const 0.965)))
            (local.set $vy (f32.mul (local.get $vy) (f32.const 0.965)))
          )
          (else
            (if (i32.eq (local.get $mode) (i32.const 1))
              (then
                ;; MODE 1: WORD FACTORY (Thermodynamic Forge Sparks & Convective Furnace)
                (local.set $vy (f32.sub (local.get $vy) (f32.mul (local.get $dt) (f32.const 0.85))))
                ;; Furnace thermal updraft on right side (x > 0.35)
                (if (f32.gt (local.get $x) (f32.const 0.35))
                  (then
                    (local.set $vy (f32.add (local.get $vy) (f32.mul (local.get $dt) (f32.add (f32.const 1.8) (local.get $intensity)))))
                    (local.set $vx (f32.add (local.get $vx) (f32.mul (local.get $vz) (f32.mul (local.get $dt) (f32.const 0.9)))))
                    (local.set $energy (f32.min (f32.const 2.2) (f32.add (local.get $energy) (f32.mul (local.get $dt) (f32.const 0.9)))))
                  )
                )
                ;; Conveyor anvil bounce at y < -0.58
                (if (f32.lt (local.get $y) (f32.const -0.58))
                  (then
                    (local.set $y (f32.const -0.58))
                    (local.set $vy (f32.mul (f32.abs (local.get $vy)) (f32.const 0.62)))
                    (local.set $vx (f32.add (local.get $vx) (f32.mul (local.get $dt) (f32.const 1.2))))
                    (local.set $energy (f32.min (f32.const 2.0) (f32.add (local.get $energy) (f32.const 0.35))))
                  )
                )
                (local.set $vx (f32.mul (local.get $vx) (f32.const 0.985)))
                (local.set $vy (f32.mul (local.get $vy) (f32.const 0.985)))
              )
              (else
                (if (i32.eq (local.get $mode) (i32.const 2))
                  (then
                    ;; MODE 2: GRAMMAR CRYPT (Gothic Arcane Soul Embers & Vortex)
                    (local.set $vy (f32.add (local.get $vy) (f32.mul (local.get $dt) (f32.add (f32.const 0.35) (f32.mul (local.get $intensity) (f32.const 0.55))))))
                    (local.set $vx
                      (f32.add
                        (local.get $vx)
                        (f32.mul (local.get $dt) (f32.sub (f32.mul (local.get $vz) (f32.const 0.55)) (f32.mul (local.get $x) (f32.const 0.45))))
                      )
                    )
                    (local.set $vx (f32.mul (local.get $vx) (f32.const 0.96)))
                    (local.set $vy (f32.mul (local.get $vy) (f32.const 0.96)))
                  )
                  (else
                    ;; MODE 3: BOARDROOM PITCH (Executive Telemetry Wavefield)
                    (local.set $targetR (f32.mul (local.get $vz) (f32.const 0.65)))
                    (local.set $vy
                      (f32.add
                        (local.get $vy)
                        (f32.mul (local.get $dt) (f32.mul (f32.sub (local.get $targetR) (local.get $y)) (f32.add (f32.const 2.4) (f32.mul (local.get $intensity) (f32.const 2.2)))))
                      )
                    )
                    (local.set $vx (f32.add (f32.const 0.22) (f32.mul (local.get $z) (f32.add (f32.const 0.25) (f32.mul (local.get $intensity) (f32.const 0.45))))))
                    (local.set $vy (f32.mul (local.get $vy) (f32.const 0.95)))
                  )
                )
              )
            )
          )
        )

        ;; Integrate position
        (local.set $x (f32.add (local.get $x) (f32.mul (local.get $vx) (local.get $dt))))
        (local.set $y (f32.add (local.get $y) (f32.mul (local.get $vy) (local.get $dt))))

        ;; Advance life & decay energy toward baseline
        (local.set $life (f32.add (local.get $life) (f32.mul (local.get $dt) (f32.const 0.28))))
        (if (f32.gt (local.get $life) (f32.const 1.0))
          (then (local.set $life (f32.sub (local.get $life) (f32.const 1.0))))
        )
        (local.set $energy
          (f32.add
            (f32.mul (local.get $energy) (f32.const 0.975))
            (f32.mul (f32.add (f32.const 0.45) (f32.mul (local.get $intensity) (f32.const 0.45))) (f32.const 0.025))
          )
        )

        ;; Toroidal / boundary wrap in [-1.18, +1.18]
        (if (f32.gt (local.get $x) (f32.const 1.18))
          (then (local.set $x (f32.const -1.17)))
        )
        (if (f32.lt (local.get $x) (f32.const -1.18))
          (then (local.set $x (f32.const 1.17)))
        )
        (if (f32.gt (local.get $y) (f32.const 1.18))
          (then
            (local.set $y (f32.const -1.15))
            (if (i32.eq (local.get $mode) (i32.const 1))
              (then
                (local.set $x (f32.sub (f32.mul (call $rand_unit) (f32.const 1.6)) (f32.const 0.8)))
                (local.set $y (f32.const -0.45))
                (local.set $vy (f32.mul (call $rand_unit) (f32.const 0.85)))
              )
            )
          )
        )
        (if (f32.lt (local.get $y) (f32.const -1.18))
          (then (local.set $y (f32.const 1.15)))
        )

        (f32.store offset=0 (local.get $ptr) (local.get $x))
        (f32.store offset=4 (local.get $ptr) (local.get $y))
        (f32.store offset=12 (local.get $ptr) (local.get $vx))
        (f32.store offset=16 (local.get $ptr) (local.get $vy))
        (f32.store offset=24 (local.get $ptr) (local.get $life))
        (f32.store offset=28 (local.get $ptr) (local.get $energy))

        (local.set $sumE
          (f32.add
            (local.get $sumE)
            (f32.add (f32.mul (local.get $vx) (local.get $vx)) (f32.mul (local.get $vy) (local.get $vy)))
          )
        )

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $top)
      )
    )

    (local.set $sumE (f32.sqrt (f32.div (local.get $sumE) (f32.convert_i32_s (local.get $count)))))
    (f32.store (i32.const 0) (local.get $sumE))
    (local.get $sumE)
  )
)
